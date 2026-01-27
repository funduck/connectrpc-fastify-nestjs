export class BaseError {
  constructor(
    public message: string,
    public httpCode: number,
  ) {}
}

export class RequestId {
  constructor(public value: string) {}
}

export class AccessToken {
  constructor(public token: string) {}
}

export abstract class AuthService {
  abstract extractAccessToken(
    authorizationHeader: string | undefined,
  ): Promise<AccessToken | null>;
}
