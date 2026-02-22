export default function StatusBar() {
  return (
    <div className="bg-white border-t px-4 py-2 text-sm flex items-center">
      <span className="mr-4">Created by Maanas Arora</span>
      <div className="flex items-center">
        <img
          src="GitHub_Invertocat_Black.svg"
          alt="GitHub"
          className="inline w-5 h-5 mr-2"
        />
        <a
          href="https://github.com/MaanasArora/oval-demo"
          className="text-blue-600 hover:underline">
          GitHub Repo
        </a>
      </div>
    </div>
  );
}
