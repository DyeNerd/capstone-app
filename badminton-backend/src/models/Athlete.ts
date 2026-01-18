import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { TrainingSession } from './TrainingSession';
import { SkillLevel, DominantHand } from '../types';

@Entity('athletes')
export class Athlete {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  athlete_name!: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth?: Date;

  @Column({ nullable: true })
  gender?: string;

  @Column({ type: 'varchar', default: 'beginner' })
  skill_level!: SkillLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height_cm?: number;

  @Column({ type: 'varchar', nullable: true })
  dominant_hand?: DominantHand;

  @ManyToOne(() => User, user => user.athletes)
  @JoinColumn({ name: 'coach_id' })
  coach!: User;

  @Column({ nullable: true })
  profile_image_url?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => TrainingSession, session => session.athlete)
  training_sessions!: TrainingSession[];
}

