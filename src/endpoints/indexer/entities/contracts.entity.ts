interface Shards {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

interface Value {
  value: number;
  relation: string;
}

interface Hit {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: {
    events: {
      identifier: string;
      address: string;
      data: string | null;
      topics: string[];
      order: number;
    }[];
  };
}

interface Hits {
  total: Value;
  max_score: number;
  hits: Hit[];
}

interface LogsResponse {
  took: number;
  timed_out: boolean;
  _shards: Shards;
  hits: Hits;
}
