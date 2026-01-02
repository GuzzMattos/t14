export type AppUser = {
    uid: string;
    email: string;
    name?: string | null;
    nickname?: string | null;
    phone?: string | null;
    avatar?: string | null;
    notificationsEnabled?: boolean;
};
