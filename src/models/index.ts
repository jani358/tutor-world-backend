export { default as User, UserRole } from "./User.schema";
export type { IUser } from "./User.schema";

export { default as Question, QuestionType, QuestionDifficulty } from "./Question.schema";
export type { IQuestion, IOption } from "./Question.schema";

export { default as Quiz, QuizStatus } from "./Quiz.schema";
export type { IQuiz } from "./Quiz.schema";

export { default as QuizAttempt, AttemptStatus } from "./QuizAttempt.schema";
export type { IQuizAttempt, IAnswer } from "./QuizAttempt.schema";
