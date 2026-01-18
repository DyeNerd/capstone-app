import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Athlete } from './Athlete';
import { TrainingSession } from './TrainingSession';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ nullable: false })
  password_hash!: string;

  @Column({ nullable: false })
  username!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Athlete, athlete => athlete.coach)
  athletes!: Athlete[];

  @OneToMany(() => TrainingSession, session => session.coach)
  training_sessions!: TrainingSession[];
}

