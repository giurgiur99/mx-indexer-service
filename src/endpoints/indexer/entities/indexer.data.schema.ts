import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IndexerDataDocument = IndexerData & Document;

@Schema()
export class IndexerData {
  @Prop()
  name?: string;

  @Prop()
  pairId?: string;

  @Prop()
  address?: string;

  @Prop()
  pair?: string;

  @Prop()
  price?: string;

  @Prop()
  volume?: number;

  @Prop()
  provider?: string;
}

export const IndexerDataSchema = SchemaFactory.createForClass(IndexerData);
