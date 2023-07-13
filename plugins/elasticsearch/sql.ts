import { Parser } from 'node-sql-parser/build/mariadb'
import client from './client'
import axios from 'axios'

const parser = new Parser()

export const upload2pastebin = async (text: string) => {
  const resp = await axios.post('http://pastebin.theresa.cafe/uuppllooaadd', text, { timeout: 10e3 })
  return resp.data
}

/*
将json对象转换为 key1.key2.key3: value 的对象列表
*/

const json2kv = (json: any, prefix: string = ''): any[] => {
  const result: any[] = []

  for (const key of Object.keys(json)) {
    if (typeof json[key] === 'object') {
      result.push(...json2kv(json[key], prefix + key + '.'))
    } else {
      result.push({
        key: prefix + key,
        value: json[key]
      })
    }
  }

  return result
}


/*
把ES聚合查询的结果转换为表格

{
  "took": 171,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 10000,
      "relation": "gte"
    },
    "max_score": null,
    "hits": []
  },
  "aggregations": {
    "groupby": {
      "after_key": {
        "edda9be2": 1640687,
        "c8dc70e6": "at"
      },
      "buckets": [
        {
          "key": {
            "edda9be2": 1640687,
            "c8dc70e6": "at"
          },
          "doc_count": 2,
          "dac86cb9": {
            "count": 2,
            "min": 1640687,
            "max": 1640687,
            "avg": 1640687,
            "sum": 3281374
          },
          "d3fccc79": {
            "doc_count": 2
          }
        }
      ]
    }
  }
}
*/
const elasticAggs2Table = (result: any): string => {
  const rows: string[] = []
  
  let isFirst = true

  for (const index of Object.keys(result.aggregations.groupby.buckets)) {
    const bucket = result.aggregations.groupby.buckets[index]
    const row: string[] = []
    const header: string[] = []
    const objs = json2kv(bucket)

    for (const obj of objs) {
      if (isFirst) {
        header.push(obj.key)
      }

      row.push(obj.value)
    }

    if (isFirst) {
      rows.push(`| ${header.join(' | ')} |`)
      rows.push(`| ${header.map(() => '---').join(' | ')} |`)
      isFirst = false
    }

    rows.push(`| ${row.join(' | ')} |`)
  }

  return rows.join('\n')
}

const coverter = (sql: string, group: number) => {
  const ast = parser.astify(sql.replace(/group\.id/g, Math.random().toString(16).substring(2))) as any

  if (ast.type !== 'select') {
    return `select * from message_oicq where group.id = ${group} limit 50`
  }

  for (let i = 0; i < ast.from.length; i++) {
    if (ast.from[i].as) {
      ast.from[i].table = 'message_oicq'
    } else {
      ast.from[i].as = ast.from[i].table
      ast.from[i].table = 'message_oicq'
    }

    ast.from[i].db = null
  }

  // 在where中新增条件
  if (ast.where) {
    ast.where = {
      type: 'binary_expr',
      operator: 'AND',
      left: {
        type: 'binary_expr',
        operator: '=',
        left: {
          type: 'column_ref',
          table: 'message_oicq',
          column: 'group.id',
        },
        right: {
          type: 'number',
          value: group
        }
      },
      right: ast.where
    }
  } else {
    ast.where = {
      type: 'binary_expr',
      operator: '=',
      left: {
        type: 'column_ref',
        table: 'message_oicq',
        column: 'group.id',
      },
      right: {
        type: 'number',
        value: group
      }
    }
  }

  let result = parser.sqlify(ast)

  // 处理引号
  result = result.replace(/\`/g, '"')
  // 替换所有limit xxx为limit 50，不区分大小写
  result = result.replace(/limit\s+\d+/i, 'limit 50')

  return result
}

export const query = async (sql: string, group: number): Promise<any[] | string> => {
  const coverted_sql = coverter(sql, group)
  const query_result = await client.sql.translate({
    query: coverted_sql
  }) as any
  
  const query = {
    bool: {
      must: [{
        "match": {
          "group.id": group
        }
      }]
    }
  }

  if (query_result.query) {
    query.bool.must.push(query_result.query)
  }

  const result = await client.search({
    index: 'message_oicq',
    body: {
      query,
      aggregations: query_result.aggregations,
      size: query_result.aggregations ? 0 : 50,
      sort: [{
        timestamp: {
          order: 'desc'
        }
      }]
    }
  })

  if (result.aggregations) {
    const text = elasticAggs2Table(result)
    const url = await upload2pastebin([
      '# OwOBot SQL Query',
      `## SQL`,
      `> ${sql}`,
      `---`,
      `## Converted SQL`,
      `> ${coverted_sql}`,
      '',
      `---`,
      `## Result`,
      text
    ].join('\n'))
    return url
  } else {
    return result.hits.hits.map(e => e._source).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }
}
