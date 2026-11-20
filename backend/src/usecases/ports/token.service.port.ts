export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  timezone: string;
}

export interface ITokenService {
  signToken(payload: TokenPayload, expiresInSeconds?: number): string;
  verifyToken(token: string): TokenPayload | null;
}
