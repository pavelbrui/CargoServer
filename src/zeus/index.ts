/* eslint-disable */


import { AllTypesProps, ReturnTypes, Ops } from './const.js';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = "http://localhost:8080/"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: (Z & ValueTypes[R]) | ValueTypes[R],
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) =>
    fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (graphqlOptions?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: graphqlOptions.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: (Z & ValueTypes[R]) | ValueTypes[R],
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
    if (returnedFunction?.on && graphqlOptions?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
          if (graphqlOptions?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: graphqlOptions.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: (Z & ValueTypes[R]) | ValueTypes[R],
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariables<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = GraphQLTypes["Node"]
export type ScalarCoders = {
	Timestamp?: ScalarResolver;
	AnyObject?: ScalarResolver;
	Date?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Query"]: AliasType<{
	/** Retrieves user-related queries. */
	user?:ValueTypes["UserQuery"],
	/** Retrieves login-related queries. */
	public?:ValueTypes["PublicQuery"],
	/** Retrieves admin member-related queries. */
	admin?:ValueTypes["AdminQuery"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
	login?:ValueTypes["LoginQuery"],
	list?:boolean | `@${string}`,
calculateMyOrder?: [{	input?: ValueTypes["CalculateOrderInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** Mutations related to public actions. */
	public?:ValueTypes["PublicMutation"],
	/** Mutations related to user actions. */
	user?:ValueTypes["UserMutation"],
	/** Mutations related to admin member actions. */
	admin?:ValueTypes["AdminMutation"],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Represents a mutation for public actions. */
["PublicMutation"]: AliasType<{
register?: [{	/** The registration input object. */
	user: ValueTypes["RegisterInput"] | Variable<any, string>},ValueTypes["RegisterResponse"]],
changePasswordWithToken?: [{	token: ValueTypes["ChangePasswordWithTokenInput"] | Variable<any, string>},ValueTypes["ChangePasswordWithTokenResponse"]],
verifyEmail?: [{	/** The verification email input object. */
	verifyData: ValueTypes["VerifyEmailInput"] | Variable<any, string>},ValueTypes["VerifyEmailResponse"]],
		__typename?: boolean | `@${string}`
}>;
	/** Represents user-related mutations. */
["UserMutation"]: AliasType<{
editUser?: [{	updatedUser: ValueTypes["UpdateUserInput"] | Variable<any, string>},ValueTypes["EditUserResponse"]],
orderOps?: [{	_id: string | Variable<any, string>},ValueTypes["OrderOps"]],
	sendOrder?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username: string | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>,
	emailForMails?: string | undefined | null | Variable<any, string>
};
	/** Represents admin member-related mutations. */
["AdminMutation"]: AliasType<{
addOrder?: [{	order?: ValueTypes["CreateOrderInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
orderOps?: [{	_id: string | Variable<any, string>},ValueTypes["OrderOps"]],
	sendInvoice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string | Variable<any, string>
};
	["SimpleUserInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["LoginInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["SendTeamInvitationInput"]: {
	username: string | Variable<any, string>,
	teamId: string | Variable<any, string>,
	roles: Array<string> | Variable<any, string>
};
	["VerifyEmailInput"]: {
	token: string | Variable<any, string>
};
	["InviteTokenInput"]: {
	expires?: string | undefined | null | Variable<any, string>,
	domain?: string | undefined | null | Variable<any, string>,
	teamId?: string | undefined | null | Variable<any, string>,
	roles: Array<string> | Variable<any, string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string | Variable<any, string>,
	forgotToken: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string | Variable<any, string>,
	oldPassword: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["RegisterInput"]: {
	fullName?: string | undefined | null | Variable<any, string>,
	username: string | Variable<any, string>,
	password: string | Variable<any, string>,
	invitationToken?: string | undefined | null | Variable<any, string>
};
	/** Represents user-related queries. */
["UserQuery"]: AliasType<{
	/** Retrieves the current user. */
	me?:ValueTypes["User"],
calculateMyOrder?: [{	input?: ValueTypes["CalculateOrderInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
	myOrders?:boolean | `@${string}`,
orderDetails?: [{	_id: string | Variable<any, string>},ValueTypes["Order"]],
		__typename?: boolean | `@${string}`
}>;
	["CalculateOrderInput"]: {
	direction?: ValueTypes["CountryPairs"] | undefined | null | Variable<any, string>,
	paymentFrom?: ValueTypes["CountryCurrency"] | undefined | null | Variable<any, string>,
	unit?: ValueTypes["Unit"] | undefined | null | Variable<any, string>,
	DeliveryType?: ValueTypes["DeliveryType"] | undefined | null | Variable<any, string>,
	ownerType?: ValueTypes["OwnerType"] | undefined | null | Variable<any, string>,
	dimensions?: Array<ValueTypes["DimensionInput"] | undefined | null> | undefined | null | Variable<any, string>,
	fromDoor?: boolean | undefined | null | Variable<any, string>,
	toDoor?: boolean | undefined | null | Variable<any, string>
};
	/** Represents login-related queries. */
["LoginQuery"]: AliasType<{
password?: [{	/** The login input object. */
	user: ValueTypes["LoginInput"] | Variable<any, string>},ValueTypes["LoginResponse"]],
provider?: [{	/** The provider login input object. */
	params: ValueTypes["ProviderLoginInput"] | Variable<any, string>},ValueTypes["ProviderLoginQuery"]],
refreshToken?: [{	/** The refresh token. */
	refreshToken: string | Variable<any, string>},boolean | `@${string}`],
requestForForgotPassword?: [{	/** The username for the forgot password request. */
	username: string | Variable<any, string>},boolean | `@${string}`],
getGoogleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	/** Represents admin member-related queries. */
["AdminQuery"]: AliasType<{
orders?: [{	fieldFilter?: ValueTypes["OrdersFieldFilterInput"] | undefined | null | Variable<any, string>,	fieldRegexFilter?: ValueTypes["OrdersFieldRegexFilterInput"] | undefined | null | Variable<any, string>,	dateFilter?: ValueTypes["DateFilterInput"] | undefined | null | Variable<any, string>,	sort?: ValueTypes["SortInput"] | undefined | null | Variable<any, string>},ValueTypes["Order"]],
		__typename?: boolean | `@${string}`
}>;
	["CountryPairsPrices"]: AliasType<{
	countryPair?:boolean | `@${string}`,
	prices?:ValueTypes["PriceForCountryCurrency"],
		__typename?: boolean | `@${string}`
}>;
	["CountryPairs"]:CountryPairs;
	["PriceForCountryCurrency"]: AliasType<{
	country?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	unit?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CountryCurrency"]:CountryCurrency;
	["Unit"]:Unit;
	/** ## Header
`Authorization: admin-123456789-key` */
["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	customerId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		/** The ID of the node. */
	_id?:boolean | `@${string}`,
	/** The creation date of the node. */
	createdAt?:boolean | `@${string}`;
		['...on User']?: Omit<ValueTypes["User"],keyof ValueTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["Order"]: AliasType<{
	_id?:boolean | `@${string}`,
	clientId?:boolean | `@${string}`,
	direction?:boolean | `@${string}`,
	paymentFrom?:boolean | `@${string}`,
	units?:boolean | `@${string}`,
	from?:ValueTypes["Address"],
	to?:ValueTypes["Address"],
	DeliveryType?:boolean | `@${string}`,
	ownerType?:boolean | `@${string}`,
	totalPrice?:boolean | `@${string}`,
	dimensions?:ValueTypes["Dimension"],
	fromDoor?:boolean | `@${string}`,
	toDoor?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DraftOrder"]: AliasType<{
	_id?:boolean | `@${string}`,
	clientId?:boolean | `@${string}`,
	direction?:boolean | `@${string}`,
	paymentFrom?:boolean | `@${string}`,
	units?:boolean | `@${string}`,
	from?:ValueTypes["Address"],
	to?:ValueTypes["Address"],
	DeliveryType?:boolean | `@${string}`,
	ownerType?:boolean | `@${string}`,
	totalPrice?:boolean | `@${string}`,
	dimensions?:ValueTypes["Dimension"],
	fromDoor?:boolean | `@${string}`,
	toDoor?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Dimension"]: AliasType<{
	length?:boolean | `@${string}`,
	high?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
	wight?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DimensionInput"]: {
	length?: number | undefined | null | Variable<any, string>,
	high?: number | undefined | null | Variable<any, string>,
	width?: number | undefined | null | Variable<any, string>,
	wight?: number | undefined | null | Variable<any, string>
};
	["OwnerType"]:OwnerType;
	["DeliveryType"]:DeliveryType;
	["Address"]: AliasType<{
	country?:boolean | `@${string}`,
	flat?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
	addressGoogleString?:boolean | `@${string}`,
	person?:ValueTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["Country"]:Country;
	["OrderOps"]: AliasType<{
	delete?:boolean | `@${string}`,
update?: [{	input?: ValueTypes["UpdateOrderInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderInput"]: {
	status?: ValueTypes["OrderStatus"] | undefined | null | Variable<any, string>,
	from: ValueTypes["AddressAddInput"] | Variable<any, string>,
	to: ValueTypes["AddressAddInput"] | Variable<any, string>,
	DeliveryType: ValueTypes["DeliveryType"] | Variable<any, string>,
	ownerType: ValueTypes["OwnerType"] | Variable<any, string>,
	totalPrice: number | Variable<any, string>,
	addElements?: Array<ValueTypes["DimensionInput"]> | undefined | null | Variable<any, string>,
	removeElement?: number | undefined | null | Variable<any, string>,
	fromDoor?: boolean | undefined | null | Variable<any, string>,
	toDoor?: boolean | undefined | null | Variable<any, string>
};
	["OrderStatus"]:OrderStatus;
	["CreateOrderInput"]: {
	from: ValueTypes["AddressAddInput"] | Variable<any, string>,
	to: ValueTypes["AddressAddInput"] | Variable<any, string>,
	DeliveryType: ValueTypes["DeliveryType"] | Variable<any, string>,
	ownerType: ValueTypes["OwnerType"] | Variable<any, string>,
	totalPrice: number | Variable<any, string>,
	elements: Array<ValueTypes["DimensionInput"]> | Variable<any, string>,
	fromDoor?: boolean | undefined | null | Variable<any, string>,
	toDoor?: boolean | undefined | null | Variable<any, string>
};
	["AddressAddInput"]: {
	flat?: string | undefined | null | Variable<any, string>,
	phone?: string | undefined | null | Variable<any, string>,
	addressGoogleString: string | Variable<any, string>
};
	["Timestamp"]:unknown;
	["TimestampFilter"]: {
	Gt?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Gte?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Lt?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>,
	Lte?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>
};
	["AnyObject"]:unknown;
	["SortInput"]: {
	field: ValueTypes["SortField"] | Variable<any, string>,
	/** True for ASC, false for DESC */
	order?: boolean | undefined | null | Variable<any, string>
};
	["SortField"]:SortField;
	["ProjectsFieldFilterInput"]: {
	owner?: string | undefined | null | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	email?: string | undefined | null | Variable<any, string>
};
	["ProjectsFieldRegexFilterInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	email?: string | undefined | null | Variable<any, string>
};
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future,
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginErrors"]:LoginErrors;
	["PeriodInput"]: {
	to: string | Variable<any, string>,
	from: string | Variable<any, string>
};
	["PageOptions"]: {
	/** default is 10 */
	limit?: number | undefined | null | Variable<any, string>,
	cursorId?: string | undefined | null | Variable<any, string>
};
	["AdminOrderFilter"]: {
	searchString?: string | undefined | null | Variable<any, string>,
	paymentFrom?: ValueTypes["CountryCurrency"] | undefined | null | Variable<any, string>,
	paginate?: ValueTypes["PageOptions"] | undefined | null | Variable<any, string>,
	sort?: ValueTypes["SortOrdersInput"] | undefined | null | Variable<any, string>,
	/** driver owner username */
	driver?: Array<string> | undefined | null | Variable<any, string>,
	status?: Array<ValueTypes["OrderStatus"]> | undefined | null | Variable<any, string>,
	pay?: boolean | undefined | null | Variable<any, string>
};
	["OrderInvoice"]: AliasType<{
	address?:ValueTypes["Address"],
	cardCommission?:boolean | `@${string}`,
	/** Number to the client */
	clientPhoneNumber?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	/** price for the delivery paid by restaurant to the tenant */
	deliveryPrice?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	invoiceId?:boolean | `@${string}`,
	orderId?:boolean | `@${string}`,
	pay?:boolean | `@${string}`,
	restaurant?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Date"]:unknown;
	["ChangePassword"]: {
	password: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["FileUpload"]: AliasType<{
	filename?:boolean | `@${string}`,
	uploadURL?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Platform"]:Platform;
	["Pusher"]: AliasType<{
authorization?: [{	socketId: string | Variable<any, string>,	channel: string | Variable<any, string>},ValueTypes["PusherAuth"]],
	channels?:ValueTypes["PusherChannels"],
		__typename?: boolean | `@${string}`
}>;
	/** Represents pusher authentication payload */
["PusherAuth"]: AliasType<{
	/** Authenticates user against a pusher channel */
	auth?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Pusher channel API */
["PusherChannels"]: AliasType<{
tenantOrders?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
driverOrders?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
driverStatus?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
restaurantOrders?: [{	id: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["OrdersFieldFilterInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	content?: string | undefined | null | Variable<any, string>,
	owner?: string | undefined | null | Variable<any, string>,
	customFieldName?: string | undefined | null | Variable<any, string>
};
	["OrderPriority"]:OrderPriority;
	["OrdersFieldRegexFilterInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	content?: string | undefined | null | Variable<any, string>,
	owner?: string | undefined | null | Variable<any, string>,
	customFieldName?: string | undefined | null | Variable<any, string>
};
	["SortOrdersInput"]: {
	field: ValueTypes["SortField"] | Variable<any, string>,
	/** True for ASC, false for DESC */
	order?: boolean | undefined | null | Variable<any, string>
};
	["DateFilterInput"]: {
	/** Basicly filter use createdAt,
but you can to set other field */
	dateFieldName?: string | undefined | null | Variable<any, string>,
	from?: string | undefined | null | Variable<any, string>,
	to?: string | undefined | null | Variable<any, string>
};
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginQuery"]: AliasType<{
	apple?:ValueTypes["ProviderResponse"],
	google?:ValueTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null | Variable<any, string>,
	state?: string | undefined | null | Variable<any, string>,
	redirectUri?: string | undefined | null | Variable<any, string>
};
	["ProviderErrors"]:ProviderErrors;
	["ProviderResponse"]: AliasType<{
	hasError?:boolean | `@${string}`,
	jwt?:boolean | `@${string}`,
	access_token?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Query"]: AliasType<{
	/** Retrieves user-related queries. */
	user?:ResolverInputTypes["UserQuery"],
	/** Retrieves login-related queries. */
	public?:ResolverInputTypes["PublicQuery"],
	/** Retrieves admin member-related queries. */
	admin?:ResolverInputTypes["AdminQuery"],
		__typename?: boolean | `@${string}`
}>;
	["PublicQuery"]: AliasType<{
	login?:ResolverInputTypes["LoginQuery"],
	list?:boolean | `@${string}`,
calculateMyOrder?: [{	input?: ResolverInputTypes["CalculateOrderInput"] | undefined | null},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** Mutations related to public actions. */
	public?:ResolverInputTypes["PublicMutation"],
	/** Mutations related to user actions. */
	user?:ResolverInputTypes["UserMutation"],
	/** Mutations related to admin member actions. */
	admin?:ResolverInputTypes["AdminMutation"],
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Represents a mutation for public actions. */
["PublicMutation"]: AliasType<{
register?: [{	/** The registration input object. */
	user: ResolverInputTypes["RegisterInput"]},ResolverInputTypes["RegisterResponse"]],
changePasswordWithToken?: [{	token: ResolverInputTypes["ChangePasswordWithTokenInput"]},ResolverInputTypes["ChangePasswordWithTokenResponse"]],
verifyEmail?: [{	/** The verification email input object. */
	verifyData: ResolverInputTypes["VerifyEmailInput"]},ResolverInputTypes["VerifyEmailResponse"]],
		__typename?: boolean | `@${string}`
}>;
	/** Represents user-related mutations. */
["UserMutation"]: AliasType<{
editUser?: [{	updatedUser: ResolverInputTypes["UpdateUserInput"]},ResolverInputTypes["EditUserResponse"]],
orderOps?: [{	_id: string},ResolverInputTypes["OrderOps"]],
	sendOrder?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username: string,
	fullName?: string | undefined | null,
	phone?: string | undefined | null,
	emailForMails?: string | undefined | null
};
	/** Represents admin member-related mutations. */
["AdminMutation"]: AliasType<{
addOrder?: [{	order?: ResolverInputTypes["CreateOrderInput"] | undefined | null},boolean | `@${string}`],
orderOps?: [{	_id: string},ResolverInputTypes["OrderOps"]],
	sendInvoice?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
	username: string,
	teamId: string,
	roles: Array<string>
};
	["VerifyEmailInput"]: {
	token: string
};
	["InviteTokenInput"]: {
	expires?: string | undefined | null,
	domain?: string | undefined | null,
	teamId?: string | undefined | null,
	roles: Array<string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	fullName?: string | undefined | null,
	username: string,
	password: string,
	invitationToken?: string | undefined | null
};
	/** Represents user-related queries. */
["UserQuery"]: AliasType<{
	/** Retrieves the current user. */
	me?:ResolverInputTypes["User"],
calculateMyOrder?: [{	input?: ResolverInputTypes["CalculateOrderInput"] | undefined | null},boolean | `@${string}`],
	myOrders?:boolean | `@${string}`,
orderDetails?: [{	_id: string},ResolverInputTypes["Order"]],
		__typename?: boolean | `@${string}`
}>;
	["CalculateOrderInput"]: {
	direction?: ResolverInputTypes["CountryPairs"] | undefined | null,
	paymentFrom?: ResolverInputTypes["CountryCurrency"] | undefined | null,
	unit?: ResolverInputTypes["Unit"] | undefined | null,
	DeliveryType?: ResolverInputTypes["DeliveryType"] | undefined | null,
	ownerType?: ResolverInputTypes["OwnerType"] | undefined | null,
	dimensions?: Array<ResolverInputTypes["DimensionInput"] | undefined | null> | undefined | null,
	fromDoor?: boolean | undefined | null,
	toDoor?: boolean | undefined | null
};
	/** Represents login-related queries. */
["LoginQuery"]: AliasType<{
password?: [{	/** The login input object. */
	user: ResolverInputTypes["LoginInput"]},ResolverInputTypes["LoginResponse"]],
provider?: [{	/** The provider login input object. */
	params: ResolverInputTypes["ProviderLoginInput"]},ResolverInputTypes["ProviderLoginQuery"]],
refreshToken?: [{	/** The refresh token. */
	refreshToken: string},boolean | `@${string}`],
requestForForgotPassword?: [{	/** The username for the forgot password request. */
	username: string},boolean | `@${string}`],
getGoogleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	/** Represents admin member-related queries. */
["AdminQuery"]: AliasType<{
orders?: [{	fieldFilter?: ResolverInputTypes["OrdersFieldFilterInput"] | undefined | null,	fieldRegexFilter?: ResolverInputTypes["OrdersFieldRegexFilterInput"] | undefined | null,	dateFilter?: ResolverInputTypes["DateFilterInput"] | undefined | null,	sort?: ResolverInputTypes["SortInput"] | undefined | null},ResolverInputTypes["Order"]],
		__typename?: boolean | `@${string}`
}>;
	["CountryPairsPrices"]: AliasType<{
	countryPair?:boolean | `@${string}`,
	prices?:ResolverInputTypes["PriceForCountryCurrency"],
		__typename?: boolean | `@${string}`
}>;
	["CountryPairs"]:CountryPairs;
	["PriceForCountryCurrency"]: AliasType<{
	country?:boolean | `@${string}`,
	price?:boolean | `@${string}`,
	unit?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CountryCurrency"]:CountryCurrency;
	["Unit"]:Unit;
	/** ## Header
`Authorization: admin-123456789-key` */
["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	customerId?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Node"]:AliasType<{
		/** The ID of the node. */
	_id?:boolean | `@${string}`,
	/** The creation date of the node. */
	createdAt?:boolean | `@${string}`;
		['...on User']?: Omit<ResolverInputTypes["User"],keyof ResolverInputTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["Order"]: AliasType<{
	_id?:boolean | `@${string}`,
	clientId?:boolean | `@${string}`,
	direction?:boolean | `@${string}`,
	paymentFrom?:boolean | `@${string}`,
	units?:boolean | `@${string}`,
	from?:ResolverInputTypes["Address"],
	to?:ResolverInputTypes["Address"],
	DeliveryType?:boolean | `@${string}`,
	ownerType?:boolean | `@${string}`,
	totalPrice?:boolean | `@${string}`,
	dimensions?:ResolverInputTypes["Dimension"],
	fromDoor?:boolean | `@${string}`,
	toDoor?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DraftOrder"]: AliasType<{
	_id?:boolean | `@${string}`,
	clientId?:boolean | `@${string}`,
	direction?:boolean | `@${string}`,
	paymentFrom?:boolean | `@${string}`,
	units?:boolean | `@${string}`,
	from?:ResolverInputTypes["Address"],
	to?:ResolverInputTypes["Address"],
	DeliveryType?:boolean | `@${string}`,
	ownerType?:boolean | `@${string}`,
	totalPrice?:boolean | `@${string}`,
	dimensions?:ResolverInputTypes["Dimension"],
	fromDoor?:boolean | `@${string}`,
	toDoor?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Dimension"]: AliasType<{
	length?:boolean | `@${string}`,
	high?:boolean | `@${string}`,
	width?:boolean | `@${string}`,
	wight?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["DimensionInput"]: {
	length?: number | undefined | null,
	high?: number | undefined | null,
	width?: number | undefined | null,
	wight?: number | undefined | null
};
	["OwnerType"]:OwnerType;
	["DeliveryType"]:DeliveryType;
	["Address"]: AliasType<{
	country?:boolean | `@${string}`,
	flat?:boolean | `@${string}`,
	phone?:boolean | `@${string}`,
	addressGoogleString?:boolean | `@${string}`,
	person?:ResolverInputTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["Country"]:Country;
	["OrderOps"]: AliasType<{
	delete?:boolean | `@${string}`,
update?: [{	input?: ResolverInputTypes["UpdateOrderInput"] | undefined | null},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateOrderInput"]: {
	status?: ResolverInputTypes["OrderStatus"] | undefined | null,
	from: ResolverInputTypes["AddressAddInput"],
	to: ResolverInputTypes["AddressAddInput"],
	DeliveryType: ResolverInputTypes["DeliveryType"],
	ownerType: ResolverInputTypes["OwnerType"],
	totalPrice: number,
	addElements?: Array<ResolverInputTypes["DimensionInput"]> | undefined | null,
	removeElement?: number | undefined | null,
	fromDoor?: boolean | undefined | null,
	toDoor?: boolean | undefined | null
};
	["OrderStatus"]:OrderStatus;
	["CreateOrderInput"]: {
	from: ResolverInputTypes["AddressAddInput"],
	to: ResolverInputTypes["AddressAddInput"],
	DeliveryType: ResolverInputTypes["DeliveryType"],
	ownerType: ResolverInputTypes["OwnerType"],
	totalPrice: number,
	elements: Array<ResolverInputTypes["DimensionInput"]>,
	fromDoor?: boolean | undefined | null,
	toDoor?: boolean | undefined | null
};
	["AddressAddInput"]: {
	flat?: string | undefined | null,
	phone?: string | undefined | null,
	addressGoogleString: string
};
	["Timestamp"]:unknown;
	["TimestampFilter"]: {
	Gt?: ResolverInputTypes["Timestamp"] | undefined | null,
	Gte?: ResolverInputTypes["Timestamp"] | undefined | null,
	Lt?: ResolverInputTypes["Timestamp"] | undefined | null,
	Lte?: ResolverInputTypes["Timestamp"] | undefined | null
};
	["AnyObject"]:unknown;
	["SortInput"]: {
	field: ResolverInputTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined | null
};
	["SortField"]:SortField;
	["ProjectsFieldFilterInput"]: {
	owner?: string | undefined | null,
	name?: string | undefined | null,
	email?: string | undefined | null
};
	["ProjectsFieldRegexFilterInput"]: {
	name?: string | undefined | null,
	email?: string | undefined | null
};
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future,
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginErrors"]:LoginErrors;
	["PeriodInput"]: {
	to: string,
	from: string
};
	["PageOptions"]: {
	/** default is 10 */
	limit?: number | undefined | null,
	cursorId?: string | undefined | null
};
	["AdminOrderFilter"]: {
	searchString?: string | undefined | null,
	paymentFrom?: ResolverInputTypes["CountryCurrency"] | undefined | null,
	paginate?: ResolverInputTypes["PageOptions"] | undefined | null,
	sort?: ResolverInputTypes["SortOrdersInput"] | undefined | null,
	/** driver owner username */
	driver?: Array<string> | undefined | null,
	status?: Array<ResolverInputTypes["OrderStatus"]> | undefined | null,
	pay?: boolean | undefined | null
};
	["OrderInvoice"]: AliasType<{
	address?:ResolverInputTypes["Address"],
	cardCommission?:boolean | `@${string}`,
	/** Number to the client */
	clientPhoneNumber?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	/** price for the delivery paid by restaurant to the tenant */
	deliveryPrice?:boolean | `@${string}`,
	id?:boolean | `@${string}`,
	invoiceId?:boolean | `@${string}`,
	orderId?:boolean | `@${string}`,
	pay?:boolean | `@${string}`,
	restaurant?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Date"]:unknown;
	["ChangePassword"]: {
	password: string,
	newPassword: string
};
	["FileUpload"]: AliasType<{
	filename?:boolean | `@${string}`,
	uploadURL?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Platform"]:Platform;
	["Pusher"]: AliasType<{
authorization?: [{	socketId: string,	channel: string},ResolverInputTypes["PusherAuth"]],
	channels?:ResolverInputTypes["PusherChannels"],
		__typename?: boolean | `@${string}`
}>;
	/** Represents pusher authentication payload */
["PusherAuth"]: AliasType<{
	/** Authenticates user against a pusher channel */
	auth?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	/** Pusher channel API */
["PusherChannels"]: AliasType<{
tenantOrders?: [{	id: string},boolean | `@${string}`],
driverOrders?: [{	id: string},boolean | `@${string}`],
driverStatus?: [{	id: string},boolean | `@${string}`],
restaurantOrders?: [{	id: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["OrdersFieldFilterInput"]: {
	name?: string | undefined | null,
	content?: string | undefined | null,
	owner?: string | undefined | null,
	customFieldName?: string | undefined | null
};
	["OrderPriority"]:OrderPriority;
	["OrdersFieldRegexFilterInput"]: {
	name?: string | undefined | null,
	content?: string | undefined | null,
	owner?: string | undefined | null,
	customFieldName?: string | undefined | null
};
	["SortOrdersInput"]: {
	field: ResolverInputTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined | null
};
	["DateFilterInput"]: {
	/** Basicly filter use createdAt,
but you can to set other field */
	dateFieldName?: string | undefined | null,
	from?: string | undefined | null,
	to?: string | undefined | null
};
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginQuery"]: AliasType<{
	apple?:ResolverInputTypes["ProviderResponse"],
	google?:ResolverInputTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["ProviderErrors"]:ProviderErrors;
	["ProviderResponse"]: AliasType<{
	hasError?:boolean | `@${string}`,
	jwt?:boolean | `@${string}`,
	access_token?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Query"]: {
		/** Retrieves user-related queries. */
	user: ModelTypes["UserQuery"],
	/** Retrieves login-related queries. */
	public: ModelTypes["PublicQuery"],
	/** Retrieves admin member-related queries. */
	admin: ModelTypes["AdminQuery"]
};
	["PublicQuery"]: {
		login: ModelTypes["LoginQuery"],
	list?: Array<string | undefined> | undefined,
	calculateMyOrder?: number | undefined
};
	["Mutation"]: {
		/** Mutations related to public actions. */
	public: ModelTypes["PublicMutation"],
	/** Mutations related to user actions. */
	user: ModelTypes["UserMutation"],
	/** Mutations related to admin member actions. */
	admin: ModelTypes["AdminMutation"],
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	/** Represents a mutation for public actions. */
["PublicMutation"]: {
		/** Registers a user. */
	register: ModelTypes["RegisterResponse"],
	/** Changes the password using a token. */
	changePasswordWithToken: ModelTypes["ChangePasswordWithTokenResponse"],
	/** Verifies an email using a verification data object. */
	verifyEmail: ModelTypes["VerifyEmailResponse"]
};
	/** Represents user-related mutations. */
["UserMutation"]: {
		editUser: ModelTypes["EditUserResponse"],
	orderOps: ModelTypes["OrderOps"],
	sendOrder?: boolean | undefined
};
	["UpdateUserInput"]: {
	username: string,
	fullName?: string | undefined,
	phone?: string | undefined,
	emailForMails?: string | undefined
};
	/** Represents admin member-related mutations. */
["AdminMutation"]: {
		addOrder?: string | undefined,
	orderOps: ModelTypes["OrderOps"],
	sendInvoice?: boolean | undefined
};
	["ProviderLoginInput"]: {
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
	username: string,
	teamId: string,
	roles: Array<string>
};
	["VerifyEmailInput"]: {
	token: string
};
	["InviteTokenInput"]: {
	expires?: string | undefined,
	domain?: string | undefined,
	teamId?: string | undefined,
	roles: Array<string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	fullName?: string | undefined,
	username: string,
	password: string,
	invitationToken?: string | undefined
};
	/** Represents user-related queries. */
["UserQuery"]: {
		/** Retrieves the current user. */
	me?: ModelTypes["User"] | undefined,
	calculateMyOrder?: number | undefined,
	myOrders?: Array<string | undefined> | undefined,
	orderDetails: ModelTypes["Order"]
};
	["CalculateOrderInput"]: {
	direction?: ModelTypes["CountryPairs"] | undefined,
	paymentFrom?: ModelTypes["CountryCurrency"] | undefined,
	unit?: ModelTypes["Unit"] | undefined,
	DeliveryType?: ModelTypes["DeliveryType"] | undefined,
	ownerType?: ModelTypes["OwnerType"] | undefined,
	dimensions?: Array<ModelTypes["DimensionInput"] | undefined> | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	/** Represents login-related queries. */
["LoginQuery"]: {
		/** Authenticates a user using a password. */
	password: ModelTypes["LoginResponse"],
	/** Authenticates a user using a provider. */
	provider: ModelTypes["ProviderLoginQuery"],
	/** Refreshes an access token using a refresh token. */
	refreshToken: string,
	/** Sends a request for forgot password. */
	requestForForgotPassword: boolean,
	/** Retrieves the Google OAuth link. */
	getGoogleOAuthLink: string
};
	/** Represents admin member-related queries. */
["AdminQuery"]: {
		orders?: Array<ModelTypes["Order"] | undefined> | undefined
};
	["CountryPairsPrices"]: {
		countryPair?: ModelTypes["CountryPairs"] | undefined,
	prices?: Array<ModelTypes["PriceForCountryCurrency"]> | undefined
};
	["CountryPairs"]:CountryPairs;
	["PriceForCountryCurrency"]: {
		country?: ModelTypes["CountryCurrency"] | undefined,
	price?: number | undefined,
	unit?: ModelTypes["Unit"] | undefined
};
	["CountryCurrency"]:CountryCurrency;
	["Unit"]:Unit;
	/** ## Header
`Authorization: admin-123456789-key` */
["User"]: {
		_id: string,
	username: string,
	fullName?: string | undefined,
	emailConfirmed: boolean,
	createdAt: string,
	customerId?: string | undefined
};
	["Node"]: ModelTypes["User"];
	["Order"]: {
		_id: string,
	clientId: string,
	direction: ModelTypes["CountryPairs"],
	paymentFrom: ModelTypes["CountryCurrency"],
	units: ModelTypes["Unit"],
	from: ModelTypes["Address"],
	to: ModelTypes["Address"],
	DeliveryType: ModelTypes["DeliveryType"],
	ownerType: ModelTypes["OwnerType"],
	totalPrice: number,
	dimensions: Array<ModelTypes["Dimension"]>,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["DraftOrder"]: {
		_id: string,
	clientId: string,
	direction?: ModelTypes["CountryPairs"] | undefined,
	paymentFrom?: ModelTypes["CountryCurrency"] | undefined,
	units?: ModelTypes["Unit"] | undefined,
	from?: ModelTypes["Address"] | undefined,
	to?: ModelTypes["Address"] | undefined,
	DeliveryType?: ModelTypes["DeliveryType"] | undefined,
	ownerType?: ModelTypes["OwnerType"] | undefined,
	totalPrice?: number | undefined,
	dimensions?: Array<ModelTypes["Dimension"]> | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["Dimension"]: {
		length?: number | undefined,
	high?: number | undefined,
	width?: number | undefined,
	wight?: number | undefined
};
	["DimensionInput"]: {
	length?: number | undefined,
	high?: number | undefined,
	width?: number | undefined,
	wight?: number | undefined
};
	["OwnerType"]:OwnerType;
	["DeliveryType"]:DeliveryType;
	["Address"]: {
		country: ModelTypes["Country"],
	flat?: string | undefined,
	phone: string,
	addressGoogleString: string,
	person: ModelTypes["User"]
};
	["Country"]:Country;
	["OrderOps"]: {
		delete: boolean,
	update: boolean
};
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["ChangePasswordWithTokenError"] | undefined
};
	["UpdateOrderInput"]: {
	status?: ModelTypes["OrderStatus"] | undefined,
	from: ModelTypes["AddressAddInput"],
	to: ModelTypes["AddressAddInput"],
	DeliveryType: ModelTypes["DeliveryType"],
	ownerType: ModelTypes["OwnerType"],
	totalPrice: number,
	addElements?: Array<ModelTypes["DimensionInput"]> | undefined,
	removeElement?: number | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["OrderStatus"]:OrderStatus;
	["CreateOrderInput"]: {
	from: ModelTypes["AddressAddInput"],
	to: ModelTypes["AddressAddInput"],
	DeliveryType: ModelTypes["DeliveryType"],
	ownerType: ModelTypes["OwnerType"],
	totalPrice: number,
	elements: Array<ModelTypes["DimensionInput"]>,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["AddressAddInput"]: {
	flat?: string | undefined,
	phone?: string | undefined,
	addressGoogleString: string
};
	["Timestamp"]:any;
	["TimestampFilter"]: {
	Gt?: ModelTypes["Timestamp"] | undefined,
	Gte?: ModelTypes["Timestamp"] | undefined,
	Lt?: ModelTypes["Timestamp"] | undefined,
	Lte?: ModelTypes["Timestamp"] | undefined
};
	["AnyObject"]:any;
	["SortInput"]: {
	field: ModelTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined
};
	["SortField"]:SortField;
	["ProjectsFieldFilterInput"]: {
	owner?: string | undefined,
	name?: string | undefined,
	email?: string | undefined
};
	["ProjectsFieldRegexFilterInput"]: {
	name?: string | undefined,
	email?: string | undefined
};
	["RegisterResponse"]: {
		registered?: boolean | undefined,
	hasError?: ModelTypes["RegisterErrors"] | undefined
};
	["RegisterErrors"]:RegisterErrors;
	["VerifyEmailResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["VerifyEmailError"] | undefined
};
	["VerifyEmailError"]:VerifyEmailError;
	["LoginResponse"]: {
		/** same value as accessToken, for delete in future,
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: ModelTypes["LoginErrors"] | undefined
};
	["LoginErrors"]:LoginErrors;
	["PeriodInput"]: {
	to: string,
	from: string
};
	["PageOptions"]: {
	/** default is 10 */
	limit?: number | undefined,
	cursorId?: string | undefined
};
	["AdminOrderFilter"]: {
	searchString?: string | undefined,
	paymentFrom?: ModelTypes["CountryCurrency"] | undefined,
	paginate?: ModelTypes["PageOptions"] | undefined,
	sort?: ModelTypes["SortOrdersInput"] | undefined,
	/** driver owner username */
	driver?: Array<string> | undefined,
	status?: Array<ModelTypes["OrderStatus"]> | undefined,
	pay?: boolean | undefined
};
	["OrderInvoice"]: {
		address: ModelTypes["Address"],
	cardCommission?: number | undefined,
	/** Number to the client */
	clientPhoneNumber?: string | undefined,
	createdAt: ModelTypes["Date"],
	/** price for the delivery paid by restaurant to the tenant */
	deliveryPrice: number,
	id?: string | undefined,
	invoiceId?: string | undefined,
	orderId: string,
	pay?: boolean | undefined,
	restaurant?: string | undefined,
	total: number
};
	["Date"]:any;
	["ChangePassword"]: {
	password: string,
	newPassword: string
};
	["FileUpload"]: {
		filename: string,
	uploadURL: string
};
	["Platform"]:Platform;
	["Pusher"]: {
		/** Authenticates user against a pusher channel */
	authorization: ModelTypes["PusherAuth"],
	channels: ModelTypes["PusherChannels"]
};
	/** Represents pusher authentication payload */
["PusherAuth"]: {
		/** Authenticates user against a pusher channel */
	auth: string
};
	/** Pusher channel API */
["PusherChannels"]: {
		/** Returns an id of a channel for tenant orders */
	tenantOrders?: string | undefined,
	/** Returns an id of a channel for driver orders */
	driverOrders: string,
	/** Returns an id of a channel for driver status (online/offline) */
	driverStatus: string,
	/** Returns an id of a channel for restaurant orders */
	restaurantOrders: string
};
	["OrdersFieldFilterInput"]: {
	name?: string | undefined,
	content?: string | undefined,
	owner?: string | undefined,
	customFieldName?: string | undefined
};
	["OrderPriority"]:OrderPriority;
	["OrdersFieldRegexFilterInput"]: {
	name?: string | undefined,
	content?: string | undefined,
	owner?: string | undefined,
	customFieldName?: string | undefined
};
	["SortOrdersInput"]: {
	field: ModelTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined
};
	["DateFilterInput"]: {
	/** Basicly filter use createdAt,
but you can to set other field */
	dateFieldName?: string | undefined,
	from?: string | undefined,
	to?: string | undefined
};
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["EditUserError"] | undefined
};
	["ProviderLoginQuery"]: {
		apple?: ModelTypes["ProviderResponse"] | undefined,
	google?: ModelTypes["ProviderResponse"] | undefined
};
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["ProviderErrors"]:ProviderErrors;
	["ProviderResponse"]: {
		hasError?: ModelTypes["ProviderErrors"] | undefined,
	jwt?: string | undefined,
	access_token?: string | undefined
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    ["Query"]: {
	__typename: "Query",
	/** Retrieves user-related queries. */
	user: GraphQLTypes["UserQuery"],
	/** Retrieves login-related queries. */
	public: GraphQLTypes["PublicQuery"],
	/** Retrieves admin member-related queries. */
	admin: GraphQLTypes["AdminQuery"]
};
	["PublicQuery"]: {
	__typename: "PublicQuery",
	login: GraphQLTypes["LoginQuery"],
	list?: Array<string | undefined> | undefined,
	calculateMyOrder?: number | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	/** Mutations related to public actions. */
	public: GraphQLTypes["PublicMutation"],
	/** Mutations related to user actions. */
	user: GraphQLTypes["UserMutation"],
	/** Mutations related to admin member actions. */
	admin: GraphQLTypes["AdminMutation"],
	/** entry point for Weebhooks. */
	webhook?: string | undefined
};
	/** Represents a mutation for public actions. */
["PublicMutation"]: {
	__typename: "PublicMutation",
	/** Registers a user. */
	register: GraphQLTypes["RegisterResponse"],
	/** Changes the password using a token. */
	changePasswordWithToken: GraphQLTypes["ChangePasswordWithTokenResponse"],
	/** Verifies an email using a verification data object. */
	verifyEmail: GraphQLTypes["VerifyEmailResponse"]
};
	/** Represents user-related mutations. */
["UserMutation"]: {
	__typename: "UserMutation",
	editUser: GraphQLTypes["EditUserResponse"],
	orderOps: GraphQLTypes["OrderOps"],
	sendOrder?: boolean | undefined
};
	["UpdateUserInput"]: {
		username: string,
	fullName?: string | undefined,
	phone?: string | undefined,
	emailForMails?: string | undefined
};
	/** Represents admin member-related mutations. */
["AdminMutation"]: {
	__typename: "AdminMutation",
	addOrder?: string | undefined,
	orderOps: GraphQLTypes["OrderOps"],
	sendInvoice?: boolean | undefined
};
	["ProviderLoginInput"]: {
		code: string
};
	["SimpleUserInput"]: {
		username: string,
	password: string
};
	["LoginInput"]: {
		username: string,
	password: string
};
	["SendTeamInvitationInput"]: {
		username: string,
	teamId: string,
	roles: Array<string>
};
	["VerifyEmailInput"]: {
		token: string
};
	["InviteTokenInput"]: {
		expires?: string | undefined,
	domain?: string | undefined,
	teamId?: string | undefined,
	roles: Array<string>
};
	["ChangePasswordWithTokenInput"]: {
		username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
		username: string,
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
		fullName?: string | undefined,
	username: string,
	password: string,
	invitationToken?: string | undefined
};
	/** Represents user-related queries. */
["UserQuery"]: {
	__typename: "UserQuery",
	/** Retrieves the current user. */
	me?: GraphQLTypes["User"] | undefined,
	calculateMyOrder?: number | undefined,
	myOrders?: Array<string | undefined> | undefined,
	orderDetails: GraphQLTypes["Order"]
};
	["CalculateOrderInput"]: {
		direction?: GraphQLTypes["CountryPairs"] | undefined,
	paymentFrom?: GraphQLTypes["CountryCurrency"] | undefined,
	unit?: GraphQLTypes["Unit"] | undefined,
	DeliveryType?: GraphQLTypes["DeliveryType"] | undefined,
	ownerType?: GraphQLTypes["OwnerType"] | undefined,
	dimensions?: Array<GraphQLTypes["DimensionInput"] | undefined> | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	/** Represents login-related queries. */
["LoginQuery"]: {
	__typename: "LoginQuery",
	/** Authenticates a user using a password. */
	password: GraphQLTypes["LoginResponse"],
	/** Authenticates a user using a provider. */
	provider: GraphQLTypes["ProviderLoginQuery"],
	/** Refreshes an access token using a refresh token. */
	refreshToken: string,
	/** Sends a request for forgot password. */
	requestForForgotPassword: boolean,
	/** Retrieves the Google OAuth link. */
	getGoogleOAuthLink: string
};
	/** Represents admin member-related queries. */
["AdminQuery"]: {
	__typename: "AdminQuery",
	orders?: Array<GraphQLTypes["Order"] | undefined> | undefined
};
	["CountryPairsPrices"]: {
	__typename: "CountryPairsPrices",
	countryPair?: GraphQLTypes["CountryPairs"] | undefined,
	prices?: Array<GraphQLTypes["PriceForCountryCurrency"]> | undefined
};
	["CountryPairs"]: CountryPairs;
	["PriceForCountryCurrency"]: {
	__typename: "PriceForCountryCurrency",
	country?: GraphQLTypes["CountryCurrency"] | undefined,
	price?: number | undefined,
	unit?: GraphQLTypes["Unit"] | undefined
};
	["CountryCurrency"]: CountryCurrency;
	["Unit"]: Unit;
	/** ## Header
`Authorization: admin-123456789-key` */
["User"]: {
	__typename: "User",
	_id: string,
	username: string,
	fullName?: string | undefined,
	emailConfirmed: boolean,
	createdAt: string,
	customerId?: string | undefined
};
	["Node"]: {
	__typename:"User",
	/** The ID of the node. */
	_id: string,
	/** The creation date of the node. */
	createdAt: string
	['...on User']: '__union' & GraphQLTypes["User"];
};
	["Order"]: {
	__typename: "Order",
	_id: string,
	clientId: string,
	direction: GraphQLTypes["CountryPairs"],
	paymentFrom: GraphQLTypes["CountryCurrency"],
	units: GraphQLTypes["Unit"],
	from: GraphQLTypes["Address"],
	to: GraphQLTypes["Address"],
	DeliveryType: GraphQLTypes["DeliveryType"],
	ownerType: GraphQLTypes["OwnerType"],
	totalPrice: number,
	dimensions: Array<GraphQLTypes["Dimension"]>,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["DraftOrder"]: {
	__typename: "DraftOrder",
	_id: string,
	clientId: string,
	direction?: GraphQLTypes["CountryPairs"] | undefined,
	paymentFrom?: GraphQLTypes["CountryCurrency"] | undefined,
	units?: GraphQLTypes["Unit"] | undefined,
	from?: GraphQLTypes["Address"] | undefined,
	to?: GraphQLTypes["Address"] | undefined,
	DeliveryType?: GraphQLTypes["DeliveryType"] | undefined,
	ownerType?: GraphQLTypes["OwnerType"] | undefined,
	totalPrice?: number | undefined,
	dimensions?: Array<GraphQLTypes["Dimension"]> | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["Dimension"]: {
	__typename: "Dimension",
	length?: number | undefined,
	high?: number | undefined,
	width?: number | undefined,
	wight?: number | undefined
};
	["DimensionInput"]: {
		length?: number | undefined,
	high?: number | undefined,
	width?: number | undefined,
	wight?: number | undefined
};
	["OwnerType"]: OwnerType;
	["DeliveryType"]: DeliveryType;
	["Address"]: {
	__typename: "Address",
	country: GraphQLTypes["Country"],
	flat?: string | undefined,
	phone: string,
	addressGoogleString: string,
	person: GraphQLTypes["User"]
};
	["Country"]: Country;
	["OrderOps"]: {
	__typename: "OrderOps",
	delete: boolean,
	update: boolean
};
	["ChangePasswordWithTokenError"]: ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
	__typename: "ChangePasswordWithTokenResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["ChangePasswordWithTokenError"] | undefined
};
	["UpdateOrderInput"]: {
		status?: GraphQLTypes["OrderStatus"] | undefined,
	from: GraphQLTypes["AddressAddInput"],
	to: GraphQLTypes["AddressAddInput"],
	DeliveryType: GraphQLTypes["DeliveryType"],
	ownerType: GraphQLTypes["OwnerType"],
	totalPrice: number,
	addElements?: Array<GraphQLTypes["DimensionInput"]> | undefined,
	removeElement?: number | undefined,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["OrderStatus"]: OrderStatus;
	["CreateOrderInput"]: {
		from: GraphQLTypes["AddressAddInput"],
	to: GraphQLTypes["AddressAddInput"],
	DeliveryType: GraphQLTypes["DeliveryType"],
	ownerType: GraphQLTypes["OwnerType"],
	totalPrice: number,
	elements: Array<GraphQLTypes["DimensionInput"]>,
	fromDoor?: boolean | undefined,
	toDoor?: boolean | undefined
};
	["AddressAddInput"]: {
		flat?: string | undefined,
	phone?: string | undefined,
	addressGoogleString: string
};
	["Timestamp"]: "scalar" & { name: "Timestamp" };
	["TimestampFilter"]: {
		Gt?: GraphQLTypes["Timestamp"] | undefined,
	Gte?: GraphQLTypes["Timestamp"] | undefined,
	Lt?: GraphQLTypes["Timestamp"] | undefined,
	Lte?: GraphQLTypes["Timestamp"] | undefined
};
	["AnyObject"]: "scalar" & { name: "AnyObject" };
	["SortInput"]: {
		field: GraphQLTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined
};
	["SortField"]: SortField;
	["ProjectsFieldFilterInput"]: {
		owner?: string | undefined,
	name?: string | undefined,
	email?: string | undefined
};
	["ProjectsFieldRegexFilterInput"]: {
		name?: string | undefined,
	email?: string | undefined
};
	["RegisterResponse"]: {
	__typename: "RegisterResponse",
	registered?: boolean | undefined,
	hasError?: GraphQLTypes["RegisterErrors"] | undefined
};
	["RegisterErrors"]: RegisterErrors;
	["VerifyEmailResponse"]: {
	__typename: "VerifyEmailResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["VerifyEmailError"] | undefined
};
	["VerifyEmailError"]: VerifyEmailError;
	["LoginResponse"]: {
	__typename: "LoginResponse",
	/** same value as accessToken, for delete in future,
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: GraphQLTypes["LoginErrors"] | undefined
};
	["LoginErrors"]: LoginErrors;
	["PeriodInput"]: {
		to: string,
	from: string
};
	["PageOptions"]: {
		/** default is 10 */
	limit?: number | undefined,
	cursorId?: string | undefined
};
	["AdminOrderFilter"]: {
		searchString?: string | undefined,
	paymentFrom?: GraphQLTypes["CountryCurrency"] | undefined,
	paginate?: GraphQLTypes["PageOptions"] | undefined,
	sort?: GraphQLTypes["SortOrdersInput"] | undefined,
	/** driver owner username */
	driver?: Array<string> | undefined,
	status?: Array<GraphQLTypes["OrderStatus"]> | undefined,
	pay?: boolean | undefined
};
	["OrderInvoice"]: {
	__typename: "OrderInvoice",
	address: GraphQLTypes["Address"],
	cardCommission?: number | undefined,
	/** Number to the client */
	clientPhoneNumber?: string | undefined,
	createdAt: GraphQLTypes["Date"],
	/** price for the delivery paid by restaurant to the tenant */
	deliveryPrice: number,
	id?: string | undefined,
	invoiceId?: string | undefined,
	orderId: string,
	pay?: boolean | undefined,
	restaurant?: string | undefined,
	total: number
};
	["Date"]: "scalar" & { name: "Date" };
	["ChangePassword"]: {
		password: string,
	newPassword: string
};
	["FileUpload"]: {
	__typename: "FileUpload",
	filename: string,
	uploadURL: string
};
	["Platform"]: Platform;
	["Pusher"]: {
	__typename: "Pusher",
	/** Authenticates user against a pusher channel */
	authorization: GraphQLTypes["PusherAuth"],
	channels: GraphQLTypes["PusherChannels"]
};
	/** Represents pusher authentication payload */
["PusherAuth"]: {
	__typename: "PusherAuth",
	/** Authenticates user against a pusher channel */
	auth: string
};
	/** Pusher channel API */
["PusherChannels"]: {
	__typename: "PusherChannels",
	/** Returns an id of a channel for tenant orders */
	tenantOrders?: string | undefined,
	/** Returns an id of a channel for driver orders */
	driverOrders: string,
	/** Returns an id of a channel for driver status (online/offline) */
	driverStatus: string,
	/** Returns an id of a channel for restaurant orders */
	restaurantOrders: string
};
	["OrdersFieldFilterInput"]: {
		name?: string | undefined,
	content?: string | undefined,
	owner?: string | undefined,
	customFieldName?: string | undefined
};
	["OrderPriority"]: OrderPriority;
	["OrdersFieldRegexFilterInput"]: {
		name?: string | undefined,
	content?: string | undefined,
	owner?: string | undefined,
	customFieldName?: string | undefined
};
	["SortOrdersInput"]: {
		field: GraphQLTypes["SortField"],
	/** True for ASC, false for DESC */
	order?: boolean | undefined
};
	["DateFilterInput"]: {
		/** Basicly filter use createdAt,
but you can to set other field */
	dateFieldName?: string | undefined,
	from?: string | undefined,
	to?: string | undefined
};
	["EditUserError"]: EditUserError;
	["EditUserResponse"]: {
	__typename: "EditUserResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["EditUserError"] | undefined
};
	["ProviderLoginQuery"]: {
	__typename: "ProviderLoginQuery",
	apple?: GraphQLTypes["ProviderResponse"] | undefined,
	google?: GraphQLTypes["ProviderResponse"] | undefined
};
	["GetOAuthInput"]: {
		scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["ProviderErrors"]: ProviderErrors;
	["ProviderResponse"]: {
	__typename: "ProviderResponse",
	hasError?: GraphQLTypes["ProviderErrors"] | undefined,
	jwt?: string | undefined,
	access_token?: string | undefined
}
    }
export const enum CountryPairs {
	USA_RU = "USA_RU",
	USA_PL = "USA_PL",
	CAN_PL = "CAN_PL",
	CAN_BY = "CAN_BY",
	CAN_RU = "CAN_RU",
	USA_BY = "USA_BY"
}
export const enum CountryCurrency {
	USD = "USD",
	PLN = "PLN",
	BYR = "BYR",
	RUB = "RUB"
}
export const enum Unit {
	KG = "KG"
}
export const enum OwnerType {
	BISNES = "BISNES",
	PRIVAT = "PRIVAT"
}
export const enum DeliveryType {
	SEA = "SEA",
	AIR = "AIR",
	TRAIN = "TRAIN"
}
export const enum Country {
	USA = "USA",
	BY = "BY",
	RU = "RU",
	PL = "PL",
	CAN = "CAN"
}
export const enum ChangePasswordWithTokenError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	TOKEN_IS_INVALID = "TOKEN_IS_INVALID",
	PASSWORD_IS_TOO_WEAK = "PASSWORD_IS_TOO_WEAK"
}
export const enum OrderStatus {
	CREATING = "CREATING",
	CREATED = "CREATED",
	ACCEPTED = "ACCEPTED",
	WAITING = "WAITING",
	TAKEN = "TAKEN",
	DENIED = "DENIED",
	DRIVING = "DRIVING",
	DELIVERED = "DELIVERED",
	CANCELLED = "CANCELLED",
	NOT_DELIVERED = "NOT_DELIVERED"
}
export const enum SortField {
	CREATED_AT = "CREATED_AT",
	NAME = "NAME",
	OWNER = "OWNER"
}
export const enum RegisterErrors {
	USERNAME_EXISTS = "USERNAME_EXISTS",
	PASSWORD_WEAK = "PASSWORD_WEAK",
	INVITE_DOMAIN_INCORRECT = "INVITE_DOMAIN_INCORRECT",
	LINK_EXPIRED = "LINK_EXPIRED",
	USERNAME_INVALID = "USERNAME_INVALID"
}
export const enum VerifyEmailError {
	TOKEN_CANNOT_BE_FOUND = "TOKEN_CANNOT_BE_FOUND"
}
export const enum LoginErrors {
	CONFIRM_EMAIL_BEFOR_LOGIN = "CONFIRM_EMAIL_BEFOR_LOGIN",
	INVALID_LOGIN_OR_PASSWORD = "INVALID_LOGIN_OR_PASSWORD",
	CANNOT_FIND_CONNECTED_USER = "CANNOT_FIND_CONNECTED_USER",
	YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = "YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL",
	UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export const enum Platform {
	ANDROID = "ANDROID",
	WEB = "WEB",
	IOS = "IOS"
}
export const enum OrderPriority {
	LOW = "LOW",
	MID = "MID",
	TOP = "TOP"
}
export const enum EditUserError {
	USERNAME_ALREADY_TAKEN = "USERNAME_ALREADY_TAKEN",
	FAILED_MONGO_UPDATE = "FAILED_MONGO_UPDATE",
	USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST"
}
export const enum ProviderErrors {
	CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = "CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN",
	CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = "CANNOT_FIND_EMAIL_FOR_THIS_PROFIL",
	CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE",
	CODE_IS_NOT_EXIST_IN_ARGS = "CODE_IS_NOT_EXIST_IN_ARGS",
	CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = "CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN",
	CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = "CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT"
}

type ZEUS_VARIABLES = {
	["UpdateUserInput"]: ValueTypes["UpdateUserInput"];
	["ProviderLoginInput"]: ValueTypes["ProviderLoginInput"];
	["SimpleUserInput"]: ValueTypes["SimpleUserInput"];
	["LoginInput"]: ValueTypes["LoginInput"];
	["SendTeamInvitationInput"]: ValueTypes["SendTeamInvitationInput"];
	["VerifyEmailInput"]: ValueTypes["VerifyEmailInput"];
	["InviteTokenInput"]: ValueTypes["InviteTokenInput"];
	["ChangePasswordWithTokenInput"]: ValueTypes["ChangePasswordWithTokenInput"];
	["ChangePasswordWhenLoggedInput"]: ValueTypes["ChangePasswordWhenLoggedInput"];
	["RegisterInput"]: ValueTypes["RegisterInput"];
	["CalculateOrderInput"]: ValueTypes["CalculateOrderInput"];
	["CountryPairs"]: ValueTypes["CountryPairs"];
	["CountryCurrency"]: ValueTypes["CountryCurrency"];
	["Unit"]: ValueTypes["Unit"];
	["DimensionInput"]: ValueTypes["DimensionInput"];
	["OwnerType"]: ValueTypes["OwnerType"];
	["DeliveryType"]: ValueTypes["DeliveryType"];
	["Country"]: ValueTypes["Country"];
	["ChangePasswordWithTokenError"]: ValueTypes["ChangePasswordWithTokenError"];
	["UpdateOrderInput"]: ValueTypes["UpdateOrderInput"];
	["OrderStatus"]: ValueTypes["OrderStatus"];
	["CreateOrderInput"]: ValueTypes["CreateOrderInput"];
	["AddressAddInput"]: ValueTypes["AddressAddInput"];
	["Timestamp"]: ValueTypes["Timestamp"];
	["TimestampFilter"]: ValueTypes["TimestampFilter"];
	["AnyObject"]: ValueTypes["AnyObject"];
	["SortInput"]: ValueTypes["SortInput"];
	["SortField"]: ValueTypes["SortField"];
	["ProjectsFieldFilterInput"]: ValueTypes["ProjectsFieldFilterInput"];
	["ProjectsFieldRegexFilterInput"]: ValueTypes["ProjectsFieldRegexFilterInput"];
	["RegisterErrors"]: ValueTypes["RegisterErrors"];
	["VerifyEmailError"]: ValueTypes["VerifyEmailError"];
	["LoginErrors"]: ValueTypes["LoginErrors"];
	["PeriodInput"]: ValueTypes["PeriodInput"];
	["PageOptions"]: ValueTypes["PageOptions"];
	["AdminOrderFilter"]: ValueTypes["AdminOrderFilter"];
	["Date"]: ValueTypes["Date"];
	["ChangePassword"]: ValueTypes["ChangePassword"];
	["Platform"]: ValueTypes["Platform"];
	["OrdersFieldFilterInput"]: ValueTypes["OrdersFieldFilterInput"];
	["OrderPriority"]: ValueTypes["OrderPriority"];
	["OrdersFieldRegexFilterInput"]: ValueTypes["OrdersFieldRegexFilterInput"];
	["SortOrdersInput"]: ValueTypes["SortOrdersInput"];
	["DateFilterInput"]: ValueTypes["DateFilterInput"];
	["EditUserError"]: ValueTypes["EditUserError"];
	["GetOAuthInput"]: ValueTypes["GetOAuthInput"];
	["ProviderErrors"]: ValueTypes["ProviderErrors"];
}