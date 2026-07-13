export interface BookQuery {
    page?: number
    limit?: number
    category?: string
    author?: string
    available?: boolean
    sort?: string
    order?: 'asc' | 'desc'
};
