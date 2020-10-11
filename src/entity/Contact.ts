import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;
}
