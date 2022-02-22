import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import e from 'cors'

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
const getApplicantsByInterviewer = db.prepare(`
    SELECT applicants.*,interviews.date,interviews.score
    FROM applicants 
    JOIN interviews
    ON applicants.id = interviews.applicantId
    WHERE interviews.interviewerId = ?;
`)
const createInterviewer = db.prepare(`
    INSERT INTO interviewers (name,email) VALUES (?,?);
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

const deleteInterview = db.prepare(`
    DELETE FROM interviews WHERE id =?;
`)

const deleteApplicant = db.prepare(`
    DELETE FROM applicants WHERE id = ?;
`)
const deleteInterviewer = db.prepare(`
    DELETE FROM interviewers WHERE id =?;
`)

const deleteInterviewByApplicant = db.prepare(`
    DELETE FROM interviews WHERE applicantId = ?;
`)

const deleteInterviewByInterviewer = db.prepare(`
    DELETE FROM interviews WHERE interviewerId = ?;
`)

const updateApplicant = db.prepare(`
    UPDATE applicants SET name =?, email = ? WHERE id =?;
`)
const updateInterviewer = db.prepare(`
    UPDATE interviewers SET name =?, email = ? WHERE id =?;
`)
const updateInterview = db.prepare(`
    UPDATE interviews SET applicantId = ?, interviewerId = ?, date = ?, score = ? WHERE id=?;
`)

app.get('/applicants', (req, res) => {
    const applicants = getApplicants.all()

    for (const applicant of applicants) {
        const interviews = getInterviewersByApplicantId.all(applicant.id)
        applicant.interviews = interviews
    }
    res.send(applicants)
})

app.get('/applicants/:id', (req, res) => {
    const id = req.params.id;
    const match = getApplicantById.get(id)
    if (match) {
        const interviews = getInterviewersByApplicantId.all(id)
        match.interviews = interviews;
        res.send(match);
    } else {
        res.status(404).send({ error: 'Applicant not found!' })
    }
})

app.get('/interviewers', (req, res) => {
    const interviewers = getInterviewers.all();

    for (const interviewer of interviewers) {
        const interviews = getApplicantsByInterviewer.all(interviewer.id)
        interviewer.interviews = interviews;
    }
    res.send(interviewers)
})

app.get('/interviewers/:id', (req, res) => {
    const id = req.params.id;
    const match = getInterviewersById.get(id);

    if (match) {
        const interviews = getApplicantsByInterviewer.all(id)
        match.interviews = interviews;
        res.send(match)
    } else {
        res.status(404).send({ error: 'Interviewer not found!' })
    }
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

app.delete('/interviews/:id', (req, res) => {
    const id = req.params.id;
    const match = getInterviewsById.get(id);

    if (match) {
        const result = deleteInterview.run(id)
        if (result.changes !== 0) {
            res.send({ message: 'Interview deleted sucessfully!' })
        } else {
            res.status(400).send({ error: 'Something went wrong!' })
        }
    } else {
        res.status(404).send({ error: 'Interview not found!' })
    }
})

app.delete('/applicants/:id', (req, res) => {
    const id = req.params.id;
    const match = getApplicantById.get(id)

    if (match) {
        deleteInterviewByApplicant.run(id);
        const result = deleteApplicant.run(id)
        if (result.changes !== 0) {
            res.send({ message: 'Applicant deleted sucessfully!' })
        } else {
            res.status(400).send({ error: 'Something went wrong!' })
        }

    } else {
        res.status(404).send({ error: 'Applicant not found!' })
    }

})

app.delete('/interviewers/:id', (req, res) => {
    const id = req.params.id;
    const match = getInterviewersById.get(id);

    if (match) {
        deleteInterviewByInterviewer.run(id)
        const result = deleteInterviewer.run(id)
        if (result.changes !== 0) {
            res.send({ message: 'Interviewer deleted sucessfully!' })
        } else {
            res.status(400).send({ error: 'Something went wrong!' })
        }
    } else {
        res.status(404).send({ error: 'Interviewer not found!' })
    }
})

app.patch('/applicants/:id', (req, res) => {
    const id = req.params.id;
    const { name, email } = req.body;
    const match = getApplicantById.get(id);
    const errors = [];

    if (name && typeof name !== 'string') {
        errors.push({ error: 'Name not a string' })
    }
    if (email && typeof email !== 'string') {
        errors.push({ error: 'Email not a string!' })
    }

    if (errors.length === 0) {
        if (match) {
            const result = updateApplicant.run(name ?? match.name, email ?? match.email, id)
            const updated = getApplicantById.get(id)
            res.send(updated)
        } else {
            res.status(404).send({ error: 'Applicant not found!' })
        }
    } else {
        res.status(400).send(errors)
    }

})

app.patch('/interviewers/:id', (req, res) => {
    const id = req.params.id;
    const { name, email } = req.body;
    const match = getInterviewersById.get(id);
    const errors = [];

    if (name && typeof name !== 'string') {
        errors.push({ error: 'Name not a string' })
    }
    if (email && typeof email !== 'string') {
        errors.push({ error: 'Email not a string!' })
    }

    if (errors.length === 0) {
        if (match) {
            const result = updateInterviewer.run(name ?? match.name, email ?? match.email, id)
            const updated = getInterviewersById.get(id)
            res.send(updated)
        } else {
            res.status(404).send({ error: 'Interviewer not found!' })
        }
    } else {
        res.status(400).send(errors)
    }

})

app.patch('/interviews/:id', (req, res) => {
    const id = req.params.id;
    const { applicantId, interviewerId, date, score } = req.body;
    const match = getInterviewsById.get(id);

    const errors = []

    if (applicantId && typeof applicantId !== 'number') {
        errors.push({ error: 'Applicant id not a number!' })
    }
    if (interviewerId && typeof interviewerId !== 'number') {
        errors.push({ error: 'Interview id not a number!' })
    }
    if (date && typeof date !== 'string') {
        errors.push({ error: 'Date not a string!' })
    }
    if (score && typeof score !== 'number') {
        errors.push({ error: 'Score not a number!' })
    }
    if (score && score < 1 || score > 10) {
        errors.push({ error: 'Score is outside range.It should be inside the interval [1,10]' })
    }

    if (errors.length === 0) {
        if (match) {
            const applicant = getApplicantById.get(applicantId)
            const interviewer = getInterviewersById.get(interviewerId)

            if (applicant && interviewer) {
                const result = updateInterview.run(applicantId ?? match.applicantId, interviewerId ?? match.interviewerId, date ?? match.date, score ?? match.score, id);
                const updated = getInterviewsById.get(id)
                res.send(updated)
            } else {
                res.status(404).send({ error: 'Applicant or Interviewer not found!' })
            }
        } else {
            res.status(404).send({ error: 'Interview not found!' })
        }
    } else {
        res.status(400).send(errors)
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
