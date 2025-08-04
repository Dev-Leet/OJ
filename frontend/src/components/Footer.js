const Footer = () => {
  return (
    <footer className="bg-white shadow-md mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} OnlineJudge. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;