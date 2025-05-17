  TechLearn AUTH-SYSTEM - README  

TechLearn AUTH-SYSTEM
=====================

User authentication and dashboard system for an  tech platform

TechLearn AUTH-SYSTEM is a web-based authentication and dashboard system for an educational platform 
Features
--------

*   Secure user registration and authentication system
*   Password security with bcrypt hashing
*   Session-based authentication
*   Mobile-responsive design with Tailwind CSS
*   User profile management

Technology Stack
----------------

*   Frontend: HTML, CSS (Tailwind CSS), JavaScript
*   Backend: Node.js, Express.js
*   Database: MongoDB with Mongoose ODM
*   Authentication: bcrypt, express-session
*   Template Engine: EJS

Setup Instructions
------------------

### Prerequisites

*   Node.js (v14.x or higher)
*   MongoDB (local Atlas)
*   npm

### Installation Steps

1\. Clone the repository

    git clone https://github.com/Srinujalaneela/Auth-system.git
    cd Auth-system

2\. Install dependencies

    npm install express mongoose bcrypt express-session ejs dotenv

3\. Create a .env file in the root directory

    PORT=5000
    MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/techlearn
    SESSION_SECRET=your_secure_random_string 
    username and password will be available in the .env file

4\. Start the server

    npm server

5\. Access the application

Open your browser and navigate to `http://localhost:5000`

Test User Credentials
---------------------

**Email:*test123@gmail.com* 

**Password:*Srinivas.'@1234'.* 

Project Structure
-----------------

    techlearn-auth-system/
    ├── models/
    │   └── user.js                 # User schema for MongoDB
    ├── views/
    │   ├── dashboard.ejs           # Dashboard EJS template
    │   ├── signin.ejs              # Sign in EJS template
    │   └── signup.ejs              # Sign up EJS template
    ├── public/
    │   |           
    │   └── images/                 # Image assets folder
    ├                
    |            
    ├─-- .env                       # for  mongodb credentials
    |─-- .gitignore                 # Git ignore file
    ├── package.json                # Project dependencies
    ├── server.js                   # Main server entry point
    └── README.md                   # Project documentation

Future Improvements
-------------------

*   Implement password reset functionality
*   Add OAuth options (Google, GitHub)
*   Create admin dashboard for user management
*   Implement email verification
*   Add two-factor authentication
*   Create user profile pages with customization options

Security Notes
--------------

*   Passwords are securely hashed using bcrypt
*   Session secrets are generated randomly using crypto
*   Input validation is performed on both client and server sides
*   MongoDB connection strings should be kept secret (use environment variables)



