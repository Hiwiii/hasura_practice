import {
    subscriptionExchange,
    cacheExchange,
    fetchExchange,
    ExchangeInput,
  } from "@urql/core";
  import { withUrqlClient } from "next-urql";
  import { createClient as createWSClient } from "graphql-ws";
  import { ExchangeIO, createClient } from "urql";
  
  const isServerSide = typeof window === "undefined";
  
  type Subscription = {
    query: string;
    variables: any;
  };
  
  const wsClient = () =>
    createWSClient({
      url: (process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string).replace(
        "http",
        "ws"
      ),
      connectionParams: async () => {
        return isServerSide
          ? {
              headers: {
                "x-hasura-admin-secret": process.env
                  .HASURA_ADMIN_SECRET as string,
              },
            }
          : {};
      },
    });
  
  const noopExchange = ({ forward }: ExchangeInput): ExchangeIO => {
    return (operations$) => {
      const operationResult$ = forward(operations$);
      return operationResult$;
    };
  };
  
  const subscribeOrNoopExchange = () =>
    isServerSide
      ? noopExchange
      : subscriptionExchange({
          forwardSubscription: (operation) => {
            return {
              subscribe: (sink) => ({
                unsubscribe: wsClient().subscribe(
                  operation as Subscription,
                  sink
                ),
              }),
            };
          },
        });
  
  const clientConfig = {
    url: process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string,
    fetchOptions: () => {
      return isServerSide
        ? {
            headers: {
              "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET as string,
            },
          }
        : {};
    },
    exchanges: [cacheExchange, fetchExchange, subscribeOrNoopExchange()],
  };
  
  export const client = createClient(clientConfig);
  
  export default withUrqlClient((ssrExchange) => {
    const exchanges = [
      cacheExchange,
      fetchExchange,
      ...clientConfig.exchanges,
      ssrExchange,
    ];
    return {
      url: clientConfig.url,
      exchanges,
      ...client,
    };
  });