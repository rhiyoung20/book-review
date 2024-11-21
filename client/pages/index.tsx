import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from 'next/link';
import axiosInstance from '@/utils/axios';
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import Header from '@/components/Header';

interface Review {
  id: number;
  title: string;
  username: string;
  createdAt: string;
  views: number;
  displayNumber: number;
}

interface ReviewsResponse {
  reviews: Review[];
  currentPage: number;
  totalPages: number;
  totalReviews: number;
}

function HomeComponent() {
  const router = useRouter();
  const { page = '1', type, term } = router.query;

  const [searchType, setSearchType] = useState<'title' | 'username'>(
    (type as 'title' | 'username') || 'title'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isSearched, setIsSearched] = useState(false);

  const fetchReviews = async (page: number, type?: string, term?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let url = `/reviews?page=${page}`;
      if (type && term) {
        url += `&type=${type}&term=${encodeURIComponent(term)}`;
      }
      
      const response = await axiosInstance.get<ReviewsResponse>(url);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
      setTotalResults(response.data.totalReviews);
    } catch (err: any) {
      console.error('리뷰 목록 조회 오류:', err);
      setReviews([]);
      setTotalResults(0);
      setError('리뷰 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (isSearched) {
      setIsSearched(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setIsSearched(true);
      router.push({
        pathname: '/',
        query: {
          page: 1,
          type: searchType,
          term: searchTerm.trim()
        }
      });
    } else {
      setIsSearched(false);
      router.push('/');
    }
  };

  useEffect(() => {
    const currentPage = parseInt(page as string) || 1;
    
    if (type && term && isSearched) {
      setSearchTerm(term as string);
      setSearchType(type as 'title' | 'username');
      fetchReviews(currentPage, type as string, term as string);
    } else if (!type && !term) {
      fetchReviews(currentPage);
    }
  }, [router.query, isSearched]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: '/',
      query: {
        page: newPage,
        ...(searchType && searchTerm && {
          type: searchType,
          term: searchTerm
        })
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2 flex-1 max-w-2xl items-center">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'title' | 'username')}
              className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="title">제목</option>
              <option value="username">글쓴이</option>
            </select>
            <Input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchTerm}
              onChange={handleSearchTermChange}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10"
            />
            <Button
              variant="solid"
              onClick={handleSearch}
              className="h-8 px-4 bg-blue-500 hover:bg-blue-600 text-white"
            >
              검색
            </Button>
          </div>
          <Link href="/write-review">
            <Button variant="solid" className="bg-blue-600 hover:bg-blue-700">리뷰 작성</Button>
          </Link>
        </div>

        {isSearched && searchTerm && (
          <div className="mb-4 text-gray-700">
            <p className="font-medium">
              '{searchTerm}' 검색 결과 ({totalResults}건)
            </p>
          </div>
        )}

        {isSearched && searchTerm && reviews.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}

        {reviews.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden my-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">글쓴이</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review, index) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/${review.id}`}>
                        <span className="text-blue-600 hover:text-blue-900 cursor-pointer">
                          {review.title}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reviews.length > 0 && totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </Button>
            <span className="py-2 px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomeComponent;