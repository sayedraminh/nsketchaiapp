export default {
  providers: [
    {
      // Clerk JWT issuer domain - this is public, not a secret
      domain: "https://blessed-coral-10.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
