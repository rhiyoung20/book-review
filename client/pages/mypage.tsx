import { useState, useEffect, useContext } from 'react'
import { Button } from "@/components/ui/Button"
import Header from '@/components/Header'
import { UserContext } from '@/context/UserContext'
import { useRouter } from 'next/router'
import axiosInstance from '@/utils/axios'
import Link from 'next/link'

interface Review {
  id: number;
  title: string;
  createdAt: string;
  bookTitle: string;
  content: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  reviewId: number;
}

interface ReviewResponse {
  reviews: Review[];
  total: number;
}

interface CommentResponse {
  comments: Comment[];
  total: number;
}

export default function MyPage() {
  const { username, checkAuthStatus } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("reviews")
  const [userReviews, setUserReviews] = useState<Review[]>([])
  const [userComments, setUserComments] = useState<Comment[]>([])
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token || !username) {
        router.push('/login');
        return;
      }

      try {
        const response = await axiosInstance.get('/auth/verify', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          const reviewsResponse = await axiosInstance.get(`/reviews/user/${username}`, {
            params: {
              page: 1,
              limit: ITEMS_PER_PAGE
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (reviewsResponse.data) {
            setUserReviews(reviewsResponse.data.reviews);
            setTotalPages(Math.ceil(reviewsResponse.data.total / ITEMS_PER_PAGE));
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        router.push('/login');
      }
    };

    if (username) {
      validateAuth();
    }
  }, [username]);

  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    const token = localStorage.getItem('token');
    
    if (value === 'comments') {
      try {
        const response = await axiosInstance.get(`/comments/user/${username}`, {
          params: {
            page: 1,
            limit: ITEMS_PER_PAGE
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data) {
          setUserComments(response.data.comments);
          setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    } else {
      try {
        const response = await axiosInstance.get(`/reviews/user/${username}`, {
          params: {
            page: 1,
            limit: ITEMS_PER_PAGE
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data) {
          setUserReviews(response.data.reviews);
          setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    }
  };

  const handlePageChange = async (newPage: number) => {
    const token = localStorage.getItem('token');
    
    try {
      if (activeTab === 'reviews') {
        const response = await axiosInstance.get(`/reviews/user/${username}`, {
          params: {
            page: newPage,
            limit: ITEMS_PER_PAGE
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUserReviews(response.data.reviews);
          setTotalPages(response.data.totalPages);
          setCurrentPage(newPage);
        }
      } else {
        const response = await axiosInstance.get(`/comments/user/${username}`, {
          params: {
            page: newPage,
            limit: ITEMS_PER_PAGE
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUserComments(response.data.comments);
          setTotalPages(response.data.totalPages);
          setCurrentPage(newPage);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <div className="mt-20 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-1/2 flex space-x-2">
              <Button 
                variant={activeTab === 'reviews' ? 'solid' : 'outline'}
                className={`flex-1 ${activeTab === 'reviews' ? 'bg-green-600 text-white' : ''}`}
                onClick={() => handleTabChange('reviews')}
              >
                내 리뷰
              </Button>
              <Button 
                variant={activeTab === 'comments' ? 'solid' : 'outline'}
                className={`flex-1 ${activeTab === 'comments' ? 'text-white' : ''}`}
                onClick={() => handleTabChange('comments')}
              >
                내 댓글
              </Button>
            </div>
          </div>

          <div className="mt-4">
            {activeTab === 'reviews' && (
              <ul className="space-y-2 text-sm">
                {userReviews && userReviews.length > 0 ? (
                  userReviews.map((review) => (
                    <li key={review.id} className="flex justify-between items-center">
                      <Link href={`/${review.id}`} className="text-blue-600 hover:underline">
                        {review.title}
                      </Link>
                      <span className="text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>작성한 리뷰가 없습니다.</li>
                )}
              </ul>
            )}
            {activeTab === 'comments' && (
              <ul className="space-y-2 text-sm">
                {userComments && userComments.length > 0 ? (
                  userComments.map((comment) => (
                    <li key={comment.id} className="flex justify-between items-center">
                      <Link href={`/${comment.reviewId}`} className="text-blue-600 hover:underline">
                        {comment.content}
                      </Link>
                      <span className="text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>작성한 댓글이 없습니다.</li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            {totalPages > 1 && (
              <div className="flex gap-2">
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
          </div>
        </div>
      </div>
      <footer className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
        <p>책익는 마을 관리자에게 문의하기: <a href="mailto:rhiyoung@naver.com" className="text-blue-600 hover:underline">rhiyoung@naver.com</a></p>
      </footer>
    </div>
  )
}
