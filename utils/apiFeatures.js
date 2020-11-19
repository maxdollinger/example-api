class APIFeatures {
     constructor(query, reqQuery) {
          this.query = query;
          this.reqQuery = reqQuery;
     }

     filter() {
          const queryObj = {
               ...this.reqQuery
          };
          const excludedFields = ['page', 'sort', 'limit', 'fields'];
          excludedFields.forEach(el => delete queryObj[el]);
          let queryString = JSON.stringify(queryObj);
          queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, '$$$&');
          this.query = this.query.find(JSON.parse(queryString));

          return this;
     }

     sort() {
          if (this.reqQuery.sort) {
               const sortBy = this.reqQuery.sort.split(',').join(' ');
               this.query = this.query.sort(sortBy);
          } else {
               this.query = this.query.sort('-createdAt');
          }

          return this;
     }

     limitFields() {
          if (this.reqQuery.fields) {
               const fields = this.reqQuery.fields.split(',').join(' ');
               this.query = this.query.select(fields);
          } else {
               this.query = this.query.select('-__v');
          }

          return this;
     }

     paginate() {
          const page = Math.abs(this.reqQuery.page) || 1;
          const limit = Math.abs(this.reqQuery.limit) || 100;
          let skip = (page - 1) * limit;

          this.query = this.query.skip(skip).limit(limit);

          return this;
     }
}

module.exports = APIFeatures;