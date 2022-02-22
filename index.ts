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

const getApplicantById = db.prepare(`
    SELECT * FROM applicants WHERE id = ?;
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

const getInterviewersById = db.prepare(`
    SELECT * FROM interviewers WHERE id = ?;
`)
const createInterviewer = db.prepare(`
    INSERT INTO interviewers (name,email) VALUES (?,?);
`)

const getApplicantsByInterviewer = db.prepare(`
    SELECT applicants.*,interviews.date,interviews.score
    FROM applicants 
    JOIN interviews
    ON applicants.id = interviews.applicantId
    WHERE interviews.interviewerId = ?;
`)

const createApplicant = db.prepare(`
    INSERT INTO applicants (name,email) VALUES (?,?);
`)

const createInterviews = db.prepare(`
    INSERT INTO interviews (applicantId,interviewerId,date,score) VALUES (?,?,?,?);
`)

const getInterviewsById = db.prepare(`
    SELECT * FROM interviews WHERE id = ?;
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

app.post('/applicants', (req, res) => {
    const { name, email } = req.body;
    const errors = []

    if (typeof name !== 'string') {
        errors.push({ error: 'Name missing or not a string!' })
    }
    if (typeof email !== 'string') {
        errors.push({ error: 'Email missing or not a string!' })
    }

    if (errors.length === 0) {
        const result = createApplicant.run(name, email);
        const newApplicant = getApplicantById.get(result.lastInsertRowid)
        res.send(newApplicant)
    } else {
        res.status(400).send(errors)
    }
})

app.post('/interviewers', (req, res) => {
    const { name, email } = req.body;
    const errors = []

    if (typeof name !== 'string') {
        errors.push({ error: 'Name missing or not a string!' })
    }
    if (typeof email !== 'string') {
        errors.push({ error: 'Email missing or not a string!' })
    }

    if (errors.length === 0) {
        const result = createInterviewer.run(name, email);
        const newInterviewer = getInterviewersById.get(result.lastInsertRowid)
        res.send(newInterviewer)
    } else {
        res.status(400).send(errors)
    }
})

app.post('/interviews', (req, res) => {
    const { applicantId, interviewerId, date, score } = req.body;
    const errors = [];

    if (typeof applicantId !== 'number') {
        errors.push({ error: 'Applicant id missing or not a number!' })
    }
    if (typeof interviewerId !== 'number') {
        errors.push({ error: 'Interviewer id missing or not a number!' })
    }
    if (typeof date !== 'string') {
        errors.push({ error: 'Date missing or not a string' })
    }
    if (typeof score !== 'number') {
        errors.push({ error: 'Score missing or not a number!' })
    }
    if (score < 1 || score > 10) {
        errors.push({ error: 'Score is not inside the scope. It should inside [1,10] interval' })
    }

    if (errors.length === 0) {
        const applicant = getApplicantById.get(applicantId)
        const interviewer = getInterviewersById.get(interviewerId)

        if (applicant && interviewer) {
            const result = createInterviews.run(applicantId, interviewerId, date, score)
            const newInterview = getInterviewsById.get(result.lastInsertRowid)
            res.send(newInterview)
        } else {
            res.status(404).send({ error: 'Applicant or Interviewer not found!' })
        }
    } else {
        res.status(400).send(errors)
    }

})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
