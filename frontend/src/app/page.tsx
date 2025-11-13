import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          <LoginForm />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Ready for backend integration
          </p>
        </div>
      </div>
    </div>
  );
}
