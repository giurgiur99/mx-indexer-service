export enum TokenType {
  FungibleESDT = 'FungibleESDT',
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
}
export class TokenFilter {
  constructor(init?: Partial<TokenFilter>) {
    Object.assign(this, init);
  }

  type?: TokenType;

  search?: string;

  name?: string;

  identifier?: string;

  identifiers?: string[];

  includeMetaESDT?: boolean;
}
