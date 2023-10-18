<h1 align="center">
  <br>
  <a href="https://lakshman-natours.herokuapp.com/"><img src="https://github.com/kobienkung/Natours/assets/59368603/93e8c119-bbf9-49a4-89a4-d09d24547122" alt="Natours" width="200"></a>
  <br>
  Natours
  <br>
</h1>

<h4 align="center">A medium-sized tour booking project build on top of NodeJS</h4>

## Key Features 📝
- Authentication and Authorization
  - Login, logout and sign-up(via API) features
  - Password reset with 10-min lifetime token sent to the email
  - Access restriction for some pages to only specified user's type
  - Secret tour feature that will not be shown on a regular page or query
  - User's existance recheck before entering some pages
- User profile
  - User CRUD
  - Username, email and photo updation
  - User's role variation (user, guide, lead-guide, admin)
- Tour
  - Tour CRUD
  - Tour query (filter, limit, sort, fields, page)
  - With geospatial data type of tour locations
  - Map of the tour's visited spot
  - Tour geospatial searching within a specified center and radius
  - Tour stats (avgRating, avgPrice, minPrice, maxPrice grouped by difficulty)
- Booking
  - Booking CRUD without payment (restrict to admin and lead-guide)
  - Creat a booking by complete the Strip payment for regular users
- Review
  - Review CRUD
  - Restriction of 1 user for 1 tour review
  - Tour's ratingsQuantity and ratingsQuantity are updated after the review is modified
- Security
  - 30 requests allowed per IP in 1 hr.
  - Maxmium limit of 10kb incoming request
  - Maxmium limit of 5MB uploading file size
  - Data sanitization against NoSQL query injection
  - Data sanitization against XSS
  - Prevention of HTTP parameter polution
- Error handler
  - Json message for the API
  - HTML render for the website
  - Aware error / generic message on production
  - Full error message on developmet
- Email
  - Customable email sending module
  - Pre-made email templates
  - Auto sender service switching on production(SendGrid) / development(Mailtrap)

## Demonstration 🖥️
Login, All tours and sigle tour page

https://github.com/kobienkung/Natours/assets/59368603/ec1714d6-d9de-4c75-9540-98a6ce6abf0f

Stripe payment

https://github.com/kobienkung/Natours/assets/59368603/2996acf5-2cbe-4761-9f56-5baeaf56555c

Name and photo update

https://github.com/kobienkung/Natours/assets/59368603/0a2c0a88-3c98-4b40-a387-d3bdeb64f298

Password update

https://github.com/kobienkung/Natours/assets/59368603/2a62ae04-cdda-4319-8d6b-b557617c7fed

Error handle examples

https://github.com/kobienkung/Natours/assets/59368603/0f2f2439-2da5-4662-a0f6-48fd6ae4bb36

