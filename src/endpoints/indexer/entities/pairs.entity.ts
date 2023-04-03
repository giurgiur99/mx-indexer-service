import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pairs')
export class Pair {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  pair?: string;

  @Column()
  price?: string;

  @Column()
  volume?: string;
}
