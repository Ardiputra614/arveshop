export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your system today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: "2,847",
            change: "+12.5%",
            color: "blue",
          },
          {
            title: "Revenue",
            value: "$24,580",
            change: "+8.2%",
            color: "green",
          },
          { title: "Orders", value: "1,249", change: "+5.7%", color: "purple" },
          { title: "Pending", value: "48", change: "-2.1%", color: "yellow" },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <div
                  className={`w-6 h-6 bg-${stat.color}-500 rounded-full`}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.change.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-gray-500 text-sm ml-2">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-medium">U{item}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    New user registration
                  </p>
                  <p className="text-sm text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                Completed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
