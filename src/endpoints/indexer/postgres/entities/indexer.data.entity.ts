import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('indexer_data')
export class IndexerData {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  address?: string;

  @Column()
  pair?: string;

  @Column()
  price?: string;

  @Column()
  volume?: number;

  @Column()
  fee?: number;

  @Column()
  burn?: number;

  @Column({ type: 'timestamp' })
  timestamp?: Date;

  @Column()
  provider?: string;
}
