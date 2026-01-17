import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { GeminiApiService } from 'src/gemini-api/gemini-api.service';
import { QueryPlan } from 'src/gemini-api/query.interface';

@Injectable()
export class MoviesService {
  private parameterCount: number = 0;
  constructor(
    private readonly geminiApiService: GeminiApiService,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async findAll(search: string, page: number, limit: number) {
    const qb = this.movieRepository
      .createQueryBuilder('movies')
      .leftJoinAndSelect('movies.genres', 'genre')
      .orderBy('movies.imdb_rating', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('movies.series_title ILIKE :keyword', {
        keyword: `%${search}%`,
      });
    }
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, lastPage: Math.ceil(total / limit) };
  }

  async findByGenre(
    genre: string,
    search: string,
    page: number,
    limit: number,
  ) {
    const qb = this.movieRepository
      .createQueryBuilder('movies')
      .innerJoin(
        'movies.genres',
        'filteredGenre',
        'filteredGenre.genre LIKE :selectedgenre',
        { selectedgenre: `%${genre}%` },
      )
      .leftJoinAndSelect('movies.genres', 'genre')
      .orderBy('movies.imdb_rating', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('movies.series_title ILIKE :keyword', {
        keyword: `%${search}%`,
      });
    }
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, lastPage: Math.ceil(total / limit) };
  }

  async findWatchlisted(
    ids: string[],
    search: string,
    page: number,
    limit: number,
  ) {
    if (!ids.length) {
      return { data: [], total: 0, page, limit, lastPage: 0 };
    }
    const qb = this.movieRepository
      .createQueryBuilder('movies')
      .leftJoinAndSelect('movies.genres', 'genre')
      .where('movies.movie_id IN (:...idArray)', { idArray: ids })
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('movies.series_title ILIKE :keyword', {
        keyword: `%${search}%`,
      });
    }
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, lastPage: Math.ceil(total / limit) };
  }

  //GPT Search

  //json query translator to
  private buildDBQuery(plan: QueryPlan): SelectQueryBuilder<Movie> {
    let qb = this.movieRepository.createQueryBuilder('m');
    this.parameterCount = 0;
    qb = qb.leftJoinAndSelect('m.genres', 'genres_alias');
    for (const join of plan.joins) {
      if (join.relation === 'movie_genres') {
        qb = qb.innerJoin(
          'movie_genres',
          join.alias,
          `${join.alias}.movie_id = m.movie_id`,
        );
      } else if (join.relation === 'genres') {
        const junctionAlias =
          plan.joins.find((j) => j.relation === 'movie_genres')?.alias || 'mg';

        qb = qb.innerJoin(
          'genres',
          join.alias,
          `${join.alias}.genre_id = ${junctionAlias}.genre_id`,
        );
      }
    }

    if (plan.where && plan.where.length > 0) {
      qb = qb.where(
        new Brackets((qb) => {
          let firstCondition = true;
          for (const condition of plan.where) {
            const paramName = `param${++this.parameterCount}`;

            const [sqlOperator, dbValue] = this.translateOperator(
              condition.operator,
              condition.value,
            );
            const sqlCondtion = `${condition.field} ${sqlOperator} :${paramName}`;

            if (firstCondition) {
              qb.where(sqlCondtion, { [paramName]: dbValue });
              firstCondition = false;
            } else if (condition.logic === 'AND') {
              qb.andWhere(sqlCondtion, { [paramName]: dbValue });
            } else if (condition.logic === 'OR') {
              qb.orWhere(sqlCondtion, { [paramName]: dbValue });
            }
          }
        }),
      );
    }
    if (plan.order_by) {
      qb = qb.orderBy(plan.order_by.field, plan.order_by.direction);
    }
    return qb;
  }

  //translate operator
  private translateOperator(
    operator: string,
    value: string | number | boolean,
  ): [string, string | number | boolean | (string | number)[]] {
    const dbValue =
      typeof value === 'string' && !isNaN(Number(value))
        ? Number(value)
        : value;

    const isTextField = typeof dbValue === 'string';

    switch (operator.toUpperCase()) {
      case '=':
        if (isTextField) {
          return ['ILIKE', `%${dbValue}%`];
        }
        return ['=', dbValue];
      case '<':
      case '>':
      case '<=':
      case '>=':
        return [operator, dbValue];

      case 'LIKE':
        if (isTextField) {
          return ['ILIKE', `${dbValue}`];
        }
        return ['LIKE', `%${dbValue}%`];
      case 'IN': {
        const arrayValue =
          typeof dbValue === 'string'
            ? dbValue.split(',').map((s) => s.trim())
            : dbValue;
        return ['IN', arrayValue];
      }

      default:
        return ['=', dbValue];
    }
  }

  //Service method
  async findwithGPT(prompt: string, page: number, limit: number) {
    const queryPlan: QueryPlan =
      await this.geminiApiService.getMovieQueryPlan(prompt);

    let queryBuilder = this.buildDBQuery(queryPlan);
    queryBuilder = queryBuilder.skip((page - 1) * limit);
    queryBuilder = queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit, lastPage: Math.ceil(total / limit) };
  }
}
