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
    commentsCount?: number;
    comments?: Comment[];
}

export interface Comment {
    id: number;
    created_at: string;
    post_id: number;
    text: string;
    nickname: string;
}