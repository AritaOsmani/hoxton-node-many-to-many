import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'

const db = new Database('./interviews.db', {
    verbose: console.log
})

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 4001;

const getApplicants = db.prepare(`
    SELECT * FROM applicants;
`)
const getInterviewersByApplicantId = db.prepare(`
    SELECT 
    interviewers.name as interviewer_name, 
    interviewers.email as interviewer_email,
    interviews.date as interview_date,interviews.score 
    FROM interviewers 
    JOIN interviews 
    ON interviewers.id = interviews.interviewerId
    WHERE interviews.applicantId = ?;
  
`)

const getInterviewers = db.prepare(`
    SELECT * FROM interviewers;
`)
const getApplicantsByInterviewer = db.prepare(`
    SELECT applicants.*,interviews.date,interviews.score
    FROM applicants 
    JOIN interviews
    ON applicants.id = interviews.applicantId
    WHERE interviews.interviewerId = ?;
`)

app.get('/applicants', (req, res) => {
    const applicants = getApplicants.all()

    for (const applicant of applicants) {
        const interviews = getInterviewersByApplicantId.all(applicant.id)
        applicant.interviews = interviews
    }
    res.send(applicants)
})

app.get('/interviewers', (req, res) => {
    const interviewers = getInterviewers.all();

    for (const interviewer of interviewers) {
        const interviews = getApplicantsByInterviewer.all(interviewer.id)
        interviewer.interviews = interviews;
    }
    res.send(interviewers)
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
