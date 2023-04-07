import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IndexerData {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  pairId?: string;

  @Column()
  address?: string;

  @Column()
  pair?: string;

  @Column()
  price?: string;

  @Column()
  volume?: number;

  @Column()
  provider?: string;
}
