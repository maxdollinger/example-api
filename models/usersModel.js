const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const usersSchema = new mongoose.Schema({
     name: {
          type: String,
          required: [true, 'Name is required'],
          validate: {
               validator: (el) => {
                    return (el.replace(/[a-zA-Z]+|\s|\b\.|\b-\b/g, '').length === 0);
               },
               message: 'Name can only contain Letters and ". -"'
          }
     },
     email: {
          type: String,
          required: [true, 'Email is required'],
          unique: [true, 'Email allready exists'],
          lowercase: true,
          validate: {
               validator: validator.isEmail,
               message: 'Email ist not valid'
          }
     },
     photo: {
          type: String
     },
     role: {
          type: String,
          default: 'user',
          enum: ['user', 'guide', 'lead-guide', 'admin'],

     },
     password: {
          type: String,
          required: [true, 'Password is required'],
          minlength: 8,
          select: false
     },
     passwordSetAt: {
          type: Date,
          select: false
     },
     passwordReset: {
          type: Object,
          select: false
     },
     isActive: {
          type: Boolean,
          select: false,
          default: true
     }
});

usersSchema.pre('validate', function(next) {
     if(this.isModified('name') || this.isNew) {
          this.name = this.name.replace(/\s\s+/g, ' ').trim();
     }
     
     next();
})

usersSchema.pre('save', async function (next) {
     if (this.isModified('password') || this.isNew) {
          this.password = await bcrypt.hash(this.password, 13);
          this.passwordSetAt = Date.now() - 1000;
     }

     next();
});

usersSchema.methods.checkPassword = function (providedPassword, userPassword) {
     return bcrypt.compare(providedPassword, userPassword);
}

usersSchema.methods.isPasswordSetAfterToken = function (jwtTimestamp) {
     const convertedPasswordSetAt = parseInt(this.passwordSetAt.getTime() / 1000)

     return jwtTimestamp <= convertedPasswordSetAt;
}

usersSchema.methods.createAndSetPasswordReset = function () {
     const resetToken = crypto.randomBytes(32).toString('hex');

     this.passwordReset = {
          token: crypto.createHash('sha256').update(resetToken).digest('hex'),
          expDate: Date.now() + 10 * 60 * 1000
     };

     return resetToken;
}

const User = mongoose.model('User', usersSchema);

module.exports = User;