import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Athlete } from './Athlete';
import { User } from './User';
import { Shot } from './Shot';
import { Rally } from './Rally';
import { SessionStatus } from '../types';

@Entity('training_sessions')
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Athlete, athlete => athlete.training_sessions)
  @JoinColumn({ name: 'athlete_id' })
  athlete!: Athlete;

  @ManyToOne(() => User, user => user.training_sessions)
  @JoinColumn({ name: 'coach_id' })
  coach!: User;

  @Column({ type: 'timestamp', nullable: false })
  start_time!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time?: Date;

  @Column({ type: 'varchar', default: 'active' })
  status!: SessionStatus;

  @Column({ type: 'integer', default: 0 })
  total_shots!: number;

  @Column({ type: 'integer', default: 0 })
  successful_shots!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  average_accuracy_percent?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  average_shot_velocity_kmh?: number;

  @Column({ nullable: true })
  target_zone?: string;

  @Column({ type: 'text', nullable: true })
  session_notes?: string;

  @Column({ type: 'integer', nullable: true })
  session_rating?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Shot, shot => shot.session, { cascade: true })
  shots!: Shot[];

  @OneToMany(() => Rally, rally => rally.session, { cascade: true })
  rallies!: Rally[];
}

