import Database from 'better-sqlite3'
import { ApplicantData, InterviewData, InterviewerData } from './Types'

const db = new Database('./interviews.db', {
    verbose: console.log
})

const applicants: ApplicantData[] = [
    {
        name: 'Arita',
        email: 'arita@email.com'
    },
    {
        name: 'Desintila',
        email: 'desintila@email.com'
    },
    {
        name: 'Besim',
        email: 'besim@email.com'
    },
    {
        name: 'Geri',
        email: 'geri@email.com'
    }
]

const interviewers: InterviewerData[] = [
    {
        name: 'Nicolas',
        email: 'nicolas@email.com'
    },
    {
        name: 'Ed',
        email: 'ed@email.com'
    },

    {
        name: 'Artiola',
        email: 'artiola@email.com'
    },
]

const interviews: InterviewData[] = [
    {
        applicantId: 1,
        interviewerId: 1,
        date: '05/01/2022',
        score: 5
    },
    {
        applicantId: 1,
        interviewerId: 2,
        date: '12/01/2022',
        score: 8
    },
    {
        applicantId: 2,
        interviewerId: 3,
        date: '04/01/2022',
        score: 3
    },
    {
        applicantId: 3,
        interviewerId: 2,
        date: '04/02/2022',
        score: 5
    },
    {
        applicantId: 3,
        interviewerId: 3,
        date: '05/02/2022',
        score: 2
    },
    {
        applicantId: 4,
        interviewerId: 1,
        date: '10/01/2022',
        score: 10
    },
    {
        applicantId: 4,
        interviewerId: 2,
        date: "17/01/2022",
        score: 6
    }
]

db.exec(`
DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS applicants;
DROP TABLE IF EXISTS interviewers;


    CREATE TABLE IF NOT EXISTS applicants (
        id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        PRIMARY KEY (id)
    );

    CREATE TABLE IF NOT EXISTS interviewers (
        id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        PRIMARY KEY(id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER,
        applicantId INTEGER NOT NULL,
        interviewerId INTEGER NOT NULL,
        date TEXT NOT NULL,
        score INTEGER CHECK(score BETWEEN 1 AND 10) NOT NULL,
        PRIMARY KEY(id),
        FOREIGN KEY(applicantId) REFERENCES applicants(id),
        FOREIGN KEY(interviewerId) REFERENCES interviewers(id)
    );
`)

const createApplicants = db.prepare(`
    INSERT INTO applicants (name,email) VALUES (?,?);
`)

const createInterviewers = db.prepare(`
    INSERT INTO interviewers (name,email) VALUES (?,?);
`)

const createInterviews = db.prepare(`
    INSERT INTO interviews (applicantId,interviewerId,date,score) VALUES (?,?,?,?);
`)

for (const applicant of applicants) {
    createApplicants.run(applicant.name, applicant.email)
}

for (const interviewer of interviewers) {
    createInterviewers.run(interviewer.name, interviewer.email)
}

for (const interview of interviews) {
    createInterviews.run(interview.applicantId, interview.interviewerId, interview.date, interview.score)
}