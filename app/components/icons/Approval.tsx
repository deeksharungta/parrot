const Approval = ({ isActive }: { isActive: boolean }) => {
  return (
    <>
      {!isActive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
        >
          <path
            d="M12.5 3L12.5 4.8M12.5 4.8L12.5 12M12.5 4.8H10.8333C8.99238 4.8 7.5 6.41177 7.5 8.4C7.5 10.3882 8.99238 12 10.8333 12H12.5M12.5 4.8H14.2717C15.8249 4.8 17.13 5.9473 17.5 7.5M12.5 12V19.2M12.5 12L14.1667 12C16.0076 12 17.5 13.6118 17.5 15.6C17.5 17.5882 16.0076 19.2 14.1667 19.2H12.5M12.5 19.2V21M12.5 19.2H10.7283C9.17512 19.2 7.87004 18.0527 7.5 16.5"
            stroke="#111111"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="25"
          height="24"
          viewBox="0 0 25 24"
          fill="none"
        >
          <rect x="0.5" width="24" height="24" rx="12" fill="black" />
          <path
            d="M12.5 3L12.5 4.8M12.5 4.8L12.5 12M12.5 4.8H10.8333C8.99238 4.8 7.5 6.41177 7.5 8.4C7.5 10.3882 8.99238 12 10.8333 12H12.5M12.5 4.8H14.2717C15.8249 4.8 17.13 5.9473 17.5 7.5M12.5 12V19.2M12.5 12L14.1667 12C16.0076 12 17.5 13.6118 17.5 15.6C17.5 17.5882 16.0076 19.2 14.1667 19.2H12.5M12.5 19.2V21M12.5 19.2H10.7283C9.17512 19.2 7.87004 18.0527 7.5 16.5"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      )}
    </>
  );
};

export default Approval;