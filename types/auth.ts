

export type Session = {
    user: {
        id: string;
        email?: string;
        role: string;
        courses: string[];
    } | null;
}