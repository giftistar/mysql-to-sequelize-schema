export interface Desc {
    Field?: string
    Type?: string
    Collation?: string
    Null?: 'YES' | 'NO'
    Key?: string
    Default?: string
    Extra?: string
    Privileges?: string
    Comment?: string
}