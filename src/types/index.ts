export interface Community {
    id: number;
    created_at: string;
    name: string;
    description: string;
    postsCount?: number;
    posts?: Post[];
}

export interface Post {
    id: number;
    created_at: string;
    community_id: number;
    title: string;
    content: string;
    nickname: string;
    // Fix: Add missing properties to support comments functionality.
    commentsCount?: number;
    comments?: Comment[];
}

// Fix: Add missing Comment interface which was causing an import error.
export interface Comment {
    id: number;
    created_at: string;
    post_id: number;
    text: string;
    nickname: string;
}
