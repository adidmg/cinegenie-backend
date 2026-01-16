import { Genre } from 'src/genres/entities/genre.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  movie_id: string;

  @Column('varchar', { length: 200 })
  poster_link: string;

  @Column('varchar', { length: 100 })
  series_title: string;

  @Column()
  released_year: number;

  @Column('varchar', { length: 10 })
  certificate: string;

  @Column()
  runtime: number;

  @Column('real')
  imdb_rating: number;

  @Column('varchar', { length: 2500 })
  overview: string;

  @Column('varchar', { length: 50 })
  director: string;

  @Column('varchar', { length: 50 })
  star1: string;

  @Column('varchar', { length: 50 })
  star2: string;

  @Column('varchar', { length: 50 })
  star3: string;

  @Column('varchar', { length: 50 })
  star4: string;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable({
    name: 'movie_genres',
    joinColumn: { name: 'movie_id', referencedColumnName: 'movie_id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'genre_id' },
  })
  genres: Genre[];
}
