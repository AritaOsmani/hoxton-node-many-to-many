export type Applicant = {
    id: number,
    name: string,
    email: string
}

export type Interviewer = {
    id: number,
    name: string,
    email: string
}

export type Interview = {
    id: number,
    applicantId: number,
    interviewerId: number,
    date: string,
    score: number
}

export type ApplicantData = Omit<Applicant, 'id'>
export type InterviewerData = Omit<Interviewer, 'id'>;
export type InterviewData = Omit<Interview, 'id'>;

