declare global {
  var mongooseClient: any;

  namespace NodeJS {
    interface ProcessEnv {
      MONGOOSE_URI: string;
      STUDENT_ENCRYPTION_KEY: string;
      ADAPT_API_BASE_URL: string;
      ADAPT_API_KEY: string;
      EWS_API_BASE_URL: string;
      EWS_API_KEY: string;
      AUTH_SECRET: string;
      DEV_LOCK_COURSE_ID: string;
      CLIENT_AUTH_SECRET: string;
      CLIENT_AUTH_ORIGIN_MATCH: string;
    }
  }
}

export {};
