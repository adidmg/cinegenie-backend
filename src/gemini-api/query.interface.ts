export interface QueryPlan {
  joins: {
    relation: string;
    alias: string;
  }[];

  where: {
    field: string;
    operator: string;
    value: string | number | boolean;
    logic: 'AND' | 'OR';
  }[];

  order_by?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
}
