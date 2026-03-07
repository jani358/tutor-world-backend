# Seed Data Import Guide

## Default password for ALL users: `password`
(bcrypt hash already included in users.json)

## Import order matters — users first, then classes, questions, quizzes

### Using mongoimport (replace YOUR_DB_NAME with your actual database name):

```bash
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" --collection users --file seed/users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" --collection classes --file seed/classes.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" --collection questions --file seed/questions.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/YOUR_DB_NAME" --collection quizzes --file seed/quizzes.json --jsonArray
```

### If using MongoDB Atlas (replace with your connection string):

```bash
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/YOUR_DB_NAME" --collection users --file seed/users.json --jsonArray
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/YOUR_DB_NAME" --collection classes --file seed/classes.json --jsonArray
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/YOUR_DB_NAME" --collection questions --file seed/questions.json --jsonArray
mongoimport --uri "mongodb+srv://username:password@cluster.mongodb.net/YOUR_DB_NAME" --collection quizzes --file seed/quizzes.json --jsonArray
```

## What's included:

### Users (9 users — users.json)
| Name | Email | Password | Role |
|------|-------|----------|------|
| Sarah Johnson | sarah.johnson@tutor.com | password | teacher |
| Michael Chen | michael.chen@tutor.com | password | teacher |
| Emily Roberts | emily.roberts@tutor.com | password | teacher |
| Alice Perera | alice.perera@student.com | password | student (Grade 9) |
| Bob Silva | bob.silva@student.com | password | student (Grade 9) |
| Cara Fernando | cara.fernando@student.com | password | student (Grade 9) |
| David Wickrama | david.wickrama@student.com | password | student (Grade 10) |
| Emma Jayasinghe | emma.jayasinghe@student.com | password | student (Grade 10) |
| Frank Dissanayake | frank.dissanayake@student.com | password | student (Grade 10) |
| Grace Bandara | grace.bandara@student.com | password | student (Grade 11) |
| Henry Ranasinghe | henry.ranasinghe@student.com | password | student (Grade 11) |
| Iris Karunarathne | iris.karunarathne@student.com | password | student (Grade 11) |

### Classes (3 classes — classes.json)
| Class | Teacher | Students |
|-------|---------|---------|
| Grade 9 Mathematics | Sarah Johnson | Alice, Bob, Cara |
| Grade 10 Science | Michael Chen | David, Emma, Frank |
| Grade 11 English Literature | Emily Roberts | Grace, Henry, Iris |

### Questions (27 questions — questions.json)
- Mathematics: 5 easy + 3 medium + 3 hard = 11 questions
- Science: 4 easy + 3 medium + 3 hard = 10 questions
- English: 3 easy + 3 medium + 3 hard = 9 questions

### Quizzes (9 quizzes — quizzes.json)
| Quiz | Subject | Level | Assigned To |
|------|---------|-------|-------------|
| Algebra Basics | Mathematics | easy | Grade 9 students |
| Geometry & Algebra Intermediate | Mathematics | medium | Grade 9 students |
| Advanced Mathematics Challenge | Mathematics | hard | Alice, Cara |
| Science Fundamentals | Science | easy | Grade 10 students |
| Physics & Biology Intermediate | Science | medium | Grade 10 students |
| Advanced Science | Science | hard | David, Frank |
| English Grammar Essentials | English | easy | Grade 11 students |
| Literature & Language Intermediate | English | medium | Grade 11 students |
| Advanced English Literary Analysis | English | hard | Grace, Iris |
