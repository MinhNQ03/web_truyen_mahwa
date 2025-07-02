"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { mangaApi } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { userApi } from "../../../services/api";

interface Chapter {
  id: number;
  number: number;
  title: string;
  createdAt: string;
  viewCount?: number;
}

interface Manga {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  artist?: string;
  status: string;
  releaseYear?: number;
  genres: string[];
  chapters: Chapter[];
  viewCount?: number;
  rating?: number;
  totalVotes?: number;
  translationTeam?: string;
}

export default function MangaDetail({ params }: { params: { id: string } }) {
  // Trích xuất id từ params và lưu vào biến riêng để tránh cảnh báo
  const mangaId = params.id;
  const { isAuthenticated } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setIsLoading(true);
        const data = await mangaApi.getManga(mangaId);
        
        // Đảm bảo chapters được sắp xếp theo số chapter (từ cao xuống thấp)
        if (data.chapters) {
          data.chapters = data.chapters.sort((a, b) => b.number - a.number);
        }
        
        setManga(data);
        
        // Kiểm tra xem manga có trong danh sách yêu thích không
        if (isAuthenticated) {
          try {
            const favorites = await mangaApi.checkFavorite(mangaId);
            setIsFavorite(favorites.isFavorite);
          } catch (err) {
            console.error("Failed to check favorite status:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch manga:", err);
        setError("Không thể tải thông tin truyện. Vui lòng thử lại sau.");
        
        // Fallback to mock data
        setManga({
          id: parseInt(mangaId),
          title: "One Piece",
          description: "Gol D. Roger, vua hải tặc với khối tài sản vô giá One Piece, đã bị xử tử. Trước khi chết, ông tiết lộ rằng kho báu của mình được giấu ở Grand Line. Monkey D. Luffy, một cậu bé với ước mơ trở thành vua hải tặc, vô tình ăn phải trái ác quỷ Gomu Gomu, biến cơ thể cậu thành cao su. Giờ đây, cậu cùng các đồng đội hải tặc mũ rơm bắt đầu cuộc hành trình tìm kiếm kho báu One Piece.",
          coverImage: "https://m.media-amazon.com/images/I/51FVFCrSp0L._AC_UF1000,1000_QL80_.jpg",
          author: "Eiichiro Oda",
          status: "ongoing",
          releaseYear: 1999,
          genres: ["Action", "Adventure", "Comedy", "Fantasy", "Shounen", "Super Power"],
          chapters: [
            {
              id: 1,
              number: 1088,
              title: "Cuộc chiến cuối cùng",
              createdAt: "2023-08-10",
              viewCount: 150000,
            },
            {
              id: 2,
              number: 1087,
              title: "Luffy vs Kaido",
              createdAt: "2023-08-03",
              viewCount: 145000,
            },
            {
              id: 3,
              number: 1086,
              title: "Bí mật của Laugh Tale",
              createdAt: "2023-07-27",
              viewCount: 140000,
            },
          ],
          viewCount: 15000000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchManga();
  }, [mangaId, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thêm truyện vào danh sách yêu thích");
      return;
    }

    try {
      await userApi.toggleFavorite(mangaId);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      alert("Không thể thực hiện. Vui lòng thử lại sau.");
    }
  };

  const renderRatingStars = () => {
    const rating = manga?.rating || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-500'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy truyện"}</p>
        <Link href="/" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Manga Info Section */}
      <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
        <div className="md:flex gap-6 p-6">
          {/* Left Column */}
          <div className="md:w-1/4">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-4">
              <img
                src={manga.cover_image.url || "/placeholder-manga.jpg"}
                alt={manga.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Rating Section */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex justify-center mb-2">
                {renderRatingStars()}
              </div>
              <div className="text-center text-gray-300">
                <span className="text-xl font-bold">{manga.rating?.toFixed(1) || "0.0"}</span>
                <span className="text-sm"> / 5</span>
                <span className="text-gray-400 text-sm block">
                  của {manga.totalVotes || 0} lượt đánh giá
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/manga/${manga.id}/chapter/${manga.chapters[manga.chapters.length - 1]?.id || 1}`}
                  className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded">
                  Chap đầu
                </Link>
                <Link href={`/manga/${manga.id}/chapter/${manga.chapters[0]?.id || 1}`}
                  className="block bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded">
                  Chap cuối
                </Link>
              </div>
              <button onClick={toggleFavorite}
                className={`block w-full text-center py-2 rounded ${
                  isFavorite ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-700 hover:bg-gray-600"
                } text-white`}>
                {isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}
              </button>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="md:w-3/4 mt-6 md:mt-0">
            <h1 className="text-3xl font-bold text-white mb-4">{manga.title}</h1>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <span className="text-gray-400">Nhóm dịch:</span>
                <span className="ml-2 text-white">{manga.translationTeam || "Chưa có"}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400">Lượt xem:</span>
                <span className="ml-2 text-white">{manga.viewCount?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.status && (
                <span className="bg-blue-900 text-blue-100 px-2 py-1 rounded text-xs">
                  {manga.status === "ongoing" ? "Đang tiến hành" : 
                   manga.status === "completed" ? "Hoàn thành" : 
                   manga.status === "hiatus" ? "Tạm ngưng" : "Đã hủy"}
                </span>
              )}
              
              {manga.viewCount && (
                <span className="bg-gray-700 text-gray-100 px-2 py-1 rounded text-xs flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {manga.viewCount >= 1000000
                    ? `${(manga.viewCount / 1000000).toFixed(1)}M`
                    : manga.viewCount >= 1000
                    ? `${(manga.viewCount / 1000).toFixed(0)}K`
                    : manga.viewCount}
                </span>
              )}
            </div>
            
            {/* Genres */}
            <div className="mb-4">
              <h2 className="text-sm text-gray-400 mb-2">Thể loại:</h2>
              <div className="flex flex-wrap gap-2">
                {manga.genres && manga.genres.map((genre, index) => {
                  // Xử lý genre dựa trên kiểu dữ liệu
                  let genreName = '';
                  
                  if (typeof genre === 'object' && genre !== null) {
                    // Sử dụng type assertion để TypeScript biết cấu trúc của đối tượng
                    const genreObj = genre as { name?: string; title?: string; id?: number | string };
                    genreName = genreObj.name || genreObj.title || String(genreObj.id || index);
                  } else if (genre === null || genre === undefined) {
                    // Nếu là null hoặc undefined, dùng giá trị mặc định
                    genreName = `genre-${index}`;
                  } else {
                    // Các trường hợp khác (string, number)
                    genreName = String(genre);
                  }
                  
                  // Tạo slug an toàn cho URL
                  const slug = genreName.toLowerCase()
                    .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
                    .replace(/\s+/g, '-')     // Thay khoảng trắng bằng dấu gạch ngang
                    || `genre-${index}`;      // Fallback nếu slug rỗng
                  
                  return (
                    <Link
                      key={index}
                      href={`/genres/${slug}`}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                    >
                      {genreName}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Info Table */}
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-gray-400">Tác giả:</div>
                <div className="col-span-2">{manga.author}</div>
                
                {manga.artist && (
                  <>
                    <div className="text-gray-400">Họa sĩ:</div>
                    <div className="col-span-2">{manga.artist}</div>
                  </>
                )}
                
                {manga.releaseYear && (
                  <>
                    <div className="text-gray-400">Năm phát hành:</div>
                    <div className="col-span-2">{manga.releaseYear}</div>
                  </>
                )}
                
                <div className="text-gray-400">Số chương:</div>
                <div className="col-span-2">{manga.chapters.length}</div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <h2 className="text-sm text-gray-400 mb-2">Mô tả:</h2>
              <p className="text-sm text-gray-300 leading-relaxed">{manga.description}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chapter List Section */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-700">Danh sách chương</h2>
        
        <div className="space-y-2">
          {manga.chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/manga/${manga.id}/chapter/${chapter.id}`}
              className="flex justify-between items-center p-3 hover:bg-gray-700 rounded transition-colors"
            >
              <div>
                <span className="font-medium">Chapter {chapter.number}</span>
                {chapter.title && <span className="ml-2 text-gray-400">- {chapter.title}</span>}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                {chapter.viewCount && (
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {chapter.viewCount >= 1000
                      ? `${(chapter.viewCount / 1000).toFixed(0)}K`
                      : chapter.viewCount}
                  </span>
                )}
                <span>{new Date(chapter.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 