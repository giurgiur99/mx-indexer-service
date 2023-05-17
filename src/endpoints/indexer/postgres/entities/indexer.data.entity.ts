import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('indexer_data')
export class IndexerData {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  address?: string;

  @Column()
  hash?: string;

  @Column()
  pair?: string;

  @Column()
  tokenIn?: string;

  @Column()
  tokenOut?: string;

  @Column()
  price?: number;

  @Column()
  volume?: number;

  @Column()
  fee?: number;

  @Column()
  burn?: number;

  @Column()
  timestamp?: string;

  @Column()
  date?: string;

  @Column()
  provider?: string;
}
