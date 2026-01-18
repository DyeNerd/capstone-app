import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TrainingSession } from './TrainingSession';
import { RallyEvent } from './RallyEvent';

@Entity('rallies')
export class Rally {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TrainingSession, session => session.rallies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: TrainingSession;

  @Column({ type: 'integer', nullable: false })
  rally_number!: number;

  @Column({ type: 'timestamp', nullable: false })
  start_time!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time?: Date;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  shot_initial_velocity_kmh?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  shot_angle_degrees?: number;

  @Column({ type: 'timestamp', nullable: true })
  hit_time?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  hit_position_x?: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  hit_position_y?: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  hit_position_z?: number;

  @Column({ type: 'timestamp', nullable: true })
  landing_time?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  landing_position_x?: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  landing_position_y?: number;

  @Column({ type: 'integer', nullable: true })
  rally_score?: number;

  @Column({ type: 'integer', nullable: true })
  reaction_time_ms?: number;

  @Column({ default: false })
  was_successful!: boolean;

  @Column({ nullable: true })
  failure_reason?: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => RallyEvent, event => event.rally, { cascade: true })
  events!: RallyEvent[];
}

