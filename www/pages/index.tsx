import type { NextPage } from "next";
import Head from "next/head";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

type Friend = {
  name: string;
};

type Data = {
  friends: Friend[];
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let friends: Friend[] = [];

  const data = await fetch(
    process.env.NEXT_PUBLIC_HASURA_PROJECT_ENDPOINT as string,
    {
      headers: {
        "x-hasura-admin-secret": process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET as string,
      },
      body: JSON.stringify({
        query: `
          query {
            friend {
              name
            }
          }
        `,
      }),
      method: "POST",
    }
  );

  const response = await data.json();
  console.log("Hasura response:", response);

  if (response?.data?.friend) {
    friends = response.data.friend;
  }

  return {
    props: { friends },
  };
};

const Home: NextPage<Data> = ({ friends }) => {
  return (
    <div>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        {friends.map((friend) => (
          <div key={friend.name}>{friend.name}</div>
        ))}
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
};

export default Home;
