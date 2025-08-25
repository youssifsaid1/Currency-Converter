import React, { useState, useEffect } from 'react';

// استيراد مكونات Chart.js و React Chart.js 2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// تسجيل المكونات اللازمة لـ Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// مكون هيكل التحميل (Skeleton Loader)
const LoadingSkeleton = ({ width, height, className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} style={{ width, height }}></div>
);

function App() {
  const [showConverter, setShowConverter] = useState(false);
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // حالات جديدة للرسوم البيانية
  const [historicalData, setHistoricalData] = useState({ labels: [], datasets: [] });
  const [chartPeriod, setChartPeriod] = useState('7d'); // 7 أيام افتراضياً

  // حالة جديدة لأزواج العملات المفضلة
  const [favoritePairs, setFavoritePairs] = useState([]); // مثل ['USD_EGP', 'EUR_USD']

  // حالة وضع الظلام
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true'; // تحويل القيمة المخزنة إلى boolean
  });

  // حالة خطأ حقل المبلغ
  const [amountError, setAmountError] = useState(null);

  const API_KEY = 'f7c29f7939a60abf4f665031'; 

  const allCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'AED', 'EGP'];

  // دالة لحفظ أزواج العملات المفضلة في localStorage
  const saveFavorites = (favs) => {
    try {
      localStorage.setItem('favoriteCurrencyPairs', JSON.stringify(favs));
    } catch (e) {
      console.error("Error saving favorites to localStorage:", e);
    }
  };

  // دالة لتحميل أزواج العملات المفضلة من localStorage
  const loadFavorites = () => {
    try {
      const storedFavorites = localStorage.getItem('favoriteCurrencyPairs');
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (e) {
      console.error("Error loading favorites from localStorage:", e);
      return [];
    }
  };

  // دالة لإضافة/إزالة زوج عملات من المفضلة
  const toggleFavorite = (currency1, currency2) => {
    const pair = `${currency1}_${currency2}`;
    const reversePair = `${currency2}_${currency1}`;
    
    setFavoritePairs(prevFavorites => {
      if (prevFavorites.includes(pair) || prevFavorites.includes(reversePair)) {
        const updatedFavorites = prevFavorites.filter(
          (fav) => fav !== pair && fav !== reversePair
        );
        saveFavorites(updatedFavorites);
        return updatedFavorites;
      } else {
        const updatedFavorites = [...prevFavorites, pair];
        saveFavorites(updatedFavorites);
        return updatedFavorites;
      }
    });
  };

  // التحقق مما إذا كان زوج العملات الحالي مفضلاً
  const isFavorite = (currency1, currency2) => {
    const pair = `${currency1}_${currency2}`;
    const reversePair = `${currency2}_${currency1}`;
    return favoritePairs.includes(pair) || favoritePairs.includes(reversePair);
  };

  // دالة جلب أسعار الصرف الحقيقية من API (للسعر الحالي)
  const fetchExchangeRate = async (from, to) => {
    setLoading(true); // تعيين التحميل إلى true عند بدء جلب البيانات
    setError(null);
    setExchangeRate(null);

    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${from}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.result === 'error') {
        throw new Error(`API Error: ${data['error-type']}`);
      }

      if (data.conversion_rates && data.conversion_rates[to]) {
        return data.conversion_rates[to];
      } else {
        throw new Error(`سعر الصرف لـ ${to} غير متاح.`);
      }

    } catch (err) {
      setError(`فشل في جلب سعر الصرف: ${err.message}. الرجاء التأكد من مفتاح الـ API واتصال الإنترنت.`);
      console.error("Error fetching exchange rate:", err);
      return null;
    } finally {
      // setLoading(false); // سنقوم بتعيين setLoading إلى false بعد جلب البيانات التاريخية أيضا
    }
  };

  // دالة وهمية لإنشاء بيانات تاريخية (في تطبيق حقيقي ستكون استدعاء لـ API تاريخي)
  const generateMockHistoricalData = (days) => {
    const labels = [];
    const data = [];
    const today = new Date();

    const baseRate = fromCurrency === toCurrency ? 1 : (exchangeRate || 30); 

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(date.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' }));
      
      const fluctuation = (Math.random() - 0.5) * (baseRate * 0.05);
      data.push((baseRate + fluctuation).toFixed(4));
    }

    return {
      labels: labels,
      datasets: [
        {
          label: `سعر ${fromCurrency} إلى ${toCurrency}`,
          data: data,
          fill: true,
          backgroundColor: darkMode ? 'rgba(100, 100, 200, 0.3)' : 'rgba(75, 192, 192, 0.2)',
          borderColor: darkMode ? 'rgba(120, 120, 250, 1)' : 'rgba(75, 192, 192, 1)',
          tension: 0.1,
        },
      ],
    };
  };

  const fetchHistoricalRatesForChart = async (from, to, period) => {
    // قم بتعيين setLoading(true) هنا إذا كان لديك API تاريخي حقيقي
    // وحافظ على setLoading(false) في الـ finally block الخاص بها
    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '6m': days = 180; break;
      case '1y': days = 365; break;
      default: days = 7;
    }
    const mockData = generateMockHistoricalData(days);
    setHistoricalData(mockData);
    setLoading(false); // نوقف التحميل بعد جلب البيانات التاريخية
  };

  const handleConvert = async () => {
    if (amount <= 0 || isNaN(amount)) {
      setAmountError("المبلغ يجب أن يكون رقماً أكبر من صفر.");
      setConvertedAmount(null);
      return;
    }
    setAmountError(null); // مسح أي خطأ سابق
    const rate = await fetchExchangeRate(fromCurrency, toCurrency);
    if (rate !== null) {
      setExchangeRate(rate);
      setConvertedAmount((amount * rate).toFixed(2));
      // بعد التحويل بنجاح، نجلب البيانات التاريخية مباشرة
      await fetchHistoricalRatesForChart(fromCurrency, toCurrency, chartPeriod);
    } else {
      setConvertedAmount(null);
    }
  };

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value);
    setAmount(value);
    if (isNaN(value) || value <= 0) {
      setAmountError("المبلغ يجب أن يكون رقماً أكبر من صفر.");
    } else {
      setAmountError(null);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
    setExchangeRate(null);
    setError(null);
    setAmountError(null); // مسح خطأ المبلغ عند التبديل
    setHistoricalData({ labels: [], datasets: [] }); // مسح بيانات الرسم البياني
  };

  // تأثير لجلب سعر الصرف الحالي وتحديثه (إذا لم يكن هناك خطأ في المبلغ)
  useEffect(() => {
    if (showConverter && amount > 0 && !isNaN(amount) && !amountError && !convertedAmount) {
      // يتم التحويل تلقائيا عند التغيير فقط إذا لم يكن هناك نتيجة سابقة
      // أو يمكن إزالته والاعتماد فقط على زر "تحويل"
      // handleConvert(); 
    }
  }, [fromCurrency, toCurrency, amount, showConverter]);

  // تأثير لجلب البيانات التاريخية للرسم البياني (فقط عند تغيير الفترة بعد التحويل الأول)
  useEffect(() => {
    if (showConverter && convertedAmount && fromCurrency && toCurrency && chartPeriod && !loading) {
      fetchHistoricalRatesForChart(fromCurrency, toCurrency, chartPeriod);
    }
  }, [chartPeriod, showConverter, convertedAmount]); // تعتمد على convertedAmount لضمان ظهورها بعد التحويل


  // تأثير لتحميل العملات المفضلة عند تحميل المكون
  useEffect(() => {
    setFavoritePairs(loadFavorites());
  }, []);

  // تأثير لحفظ وضع الظلام في localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    // تطبيق الفئة 'dark' على الـ body أو العنصر الرئيسي
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleEnterApp = () => {
    setShowConverter(true);
  };

  // خيارات الرسم البياني
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: 'sans-serif'
          },
          color: darkMode ? '#eee' : '#333' // لون التسميات في وضع الظلام
        }
      },
      title: {
        display: true,
        text: `الرسم البياني لسعر صرف ${fromCurrency} إلى ${toCurrency}`,
        font: {
          size: 18,
          family: 'sans-serif'
        },
        color: darkMode ? '#eee' : '#333' // لون العنوان في وضع الظلام
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: 'sans-serif'
          },
          color: darkMode ? '#aaa' : '#555' // لون المحور x في وضع الظلام
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' // لون الشبكة في وضع الظلام
        },
        ticks: {
          font: {
            size: 12,
            family: 'sans-serif'
          },
          color: darkMode ? '#aaa' : '#555', // لون المحور y في وضع الظلام
          callback: function(value) {
            return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
          }
        }
      }
    }
  };


  return (
    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-gray-900'} min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
      
      {/* زر تبديل وضع الظلام */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        title={darkMode ? 'الوضع الفاتح' : 'وضع الظلام'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {!showConverter ? (
        <div className={`${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'} p-10 rounded-3xl shadow-2xl max-w-md w-full text-center transform transition-transform duration-500 hover:scale-105`}>
          <h1 className="text-4xl font-extrabold mb-6 animate-pulse">مرحباً بك! 👋</h1>
          <p className="text-lg mb-8">استكشف تطبيقك العصري الآن.</p>
          
          <button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-75"
            onClick={handleEnterApp}
          >
            ادخل التطبيق الآن ✨
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-start lg:items-stretch justify-center gap-8 w-full max-w-7xl mx-auto">
          {/* مربع محول العملات */}
          <div className={`${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'} p-10 rounded-3xl shadow-2xl w-full lg:w-1/2 transform transition-transform duration-500`}>
            <h2 className="text-4xl font-bold mb-8 text-center">💸 محول العملات</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex-1 w-full relative">
                <label htmlFor="fromCurrency" className="block text-md font-medium mb-2">من:</label>
                <select
                  id="fromCurrency"
                  className={`${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} mt-1 block w-full pl-3 pr-10 py-3 text-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm appearance-none border`}
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                >
                  {favoritePairs
                    .filter(pair => pair.includes(fromCurrency) || pair.includes(toCurrency))
                    .map(pair => {
                      const [favFrom, favTo] = pair.split('_');
                      const favCurrency = (favFrom === fromCurrency || favTo === fromCurrency) ? (favFrom === fromCurrency ? favTo : favFrom) : '';
                      if (!favCurrency || !allCurrencies.includes(favCurrency)) return null;
                      return (
                        <option key={`fav-${favCurrency}`} value={favCurrency}>
                          ⭐ {favCurrency} (مفضلة)
                        </option>
                      );
                    })}
                  {allCurrencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleFavorite(fromCurrency, toCurrency)}
                  className={`absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-full text-lg 
                              ${isFavorite(fromCurrency, toCurrency) ? 'text-yellow-500' : (darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-400')}`}
                  title={isFavorite(fromCurrency, toCurrency) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  {isFavorite(fromCurrency, toCurrency) ? '⭐' : '☆'}
                </button>
              </div>

              <button
                onClick={handleSwapCurrencies}
                className="mt-8 md:mt-0 p-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 transform hover:rotate-180"
                title="تبديل العملات"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              <div className="flex-1 w-full relative">
                <label htmlFor="toCurrency" className="block text-md font-medium mb-2">إلى:</label>
                <select
                  id="toCurrency"
                  className={`${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} mt-1 block w-full pl-3 pr-10 py-3 text-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm appearance-none border`}
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                >
                   {favoritePairs
                    .filter(pair => pair.includes(fromCurrency) || pair.includes(toCurrency))
                    .map(pair => {
                      const [favFrom, favTo] = pair.split('_');
                      const favCurrency = (favFrom === toCurrency || favTo === toCurrency) ? (favFrom === toCurrency ? favTo : favFrom) : '';
                      if (!favCurrency || !allCurrencies.includes(favCurrency)) return null;
                      return (
                        <option key={`fav-${favCurrency}`} value={favCurrency}>
                          ⭐ {favCurrency} (مفضلة)
                        </option>
                      );
                    })}
                  {allCurrencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleFavorite(fromCurrency, toCurrency)}
                  className={`absolute top-1/2 right-3 -translate-y-1/2 p-1 rounded-full text-lg 
                              ${isFavorite(fromCurrency, toCurrency) ? 'text-yellow-500' : (darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-400')}`}
                  title={isFavorite(fromCurrency, toCurrency) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                >
                  {isFavorite(fromCurrency, toCurrency) ? '⭐' : '☆'}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="amount" className="block text-md font-medium mb-2">المبلغ:</label>
              <input
                type="number"
                id="amount"
                className={`${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} mt-1 block w-full shadow-md text-lg rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                value={amount}
                onChange={handleAmountChange}
                placeholder="أدخل المبلغ"
                min="0"
              />
              {amountError && (
                <p className="text-red-500 text-sm mt-2">{amountError}</p>
              )}
            </div>

            <button
              onClick={handleConvert}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-extrabold py-4 px-8 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحويل...' : 'تحويل الآن! 🚀'}
            </button>

            {convertedAmount && !loading ? (
              <div className="mt-10 p-6 bg-blue-50 border-l-8 border-blue-600 text-blue-800 rounded-xl shadow-lg animate-fade-in">
                <p className="text-xl font-semibold mb-2">
                  النتيجة: <span className="text-blue-900 text-2xl font-extrabold">{convertedAmount}</span> {toCurrency}
                </p>
                {exchangeRate && (
                  <p className="text-md font-medium text-blue-700">
                    سعر الصرف الحالي: 1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                  </p>
                )}
              </div>
            ) : (loading && (
              <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-600 border-l-8 border-gray-300 dark:border-gray-500 rounded-xl shadow-lg">
                <LoadingSkeleton width="80%" height="24px" className="mb-2" />
                <LoadingSkeleton width="60%" height="18px" />
              </div>
            ))}
          </div>

          {/* قسم الرسم البياني التاريخي الجديد - يظهر فقط بعد التحويل */}
          {convertedAmount && (
            <div className={`${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900'} p-10 rounded-3xl shadow-2xl w-full lg:w-1/2 transform transition-transform duration-500`}>
              <h3 className="text-2xl font-bold mb-6 text-center">📈 الرسوم البيانية التاريخية</h3>
              
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {['7d', '30d', '90d', '6m', '1y'].map(period => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`py-2 px-4 rounded-full text-sm font-medium transition-colors duration-200 
                                ${chartPeriod === period 
                                  ? 'bg-indigo-600 text-white shadow-md' 
                                  : (darkMode ? 'bg-gray-600 text-gray-100 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                  >
                    {period === '7d' ? '7 أيام' : period === '30d' ? '30 يوم' : period === '90d' ? '90 يوم' : period === '6m' ? '6 أشهر' : 'سنة'}
                  </button>
                ))}
              </div>

              <div className="relative h-64 md:h-80 lg:h-96">
                {loading ? (
                  <LoadingSkeleton width="100%" height="100%" />
                ) : (
                  <Line data={historicalData} options={chartOptions} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
