import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { CustomRequest } from '../types/auth';
import { Prisma } from '@prisma/client';

// 리뷰 생성
export const createReview = async (req: CustomRequest, res: Response) => {
  try {
    const { content, title, bookTitle, publisher, bookAuthor } = req.body;
    
    if (!req.user?.username) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    if (!title || !bookTitle || !content) {
      return res.status(400).json({
        success: false,
        message: '제목, 책 제목, 내용은 필수 입력사항입니다.'
      });
    }

    const review = await prisma.review.create({
      data: {
        title,
        bookTitle,
        content,
        username: req.user.username,
        views: 0,
        ...(publisher && { publisher }),
        ...(bookAuthor && { bookAuthor }),
        user: {
          connect: {
            username: req.user.username
          }
        }
      }
    });

    return res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('리뷰 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '리뷰 생성 중 오류가 발생했습니다.'
    });
  }
};

// 리뷰 목록 조회
export const getReviews = async (req: CustomRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const searchType = req.query.type as string;
    const searchTerm = req.query.term as string;
  
    let whereClause = {};
    if (searchType && searchTerm) {
      whereClause = {
        [searchType === 'title' ? 'title' : 'username']: {
          contains: searchTerm
        }
      };
    }
  
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.review.count({ where: whereClause })
    ]);

    return res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    console.error('상세 에러 정보:', error);
    return res.status(500).json({ 
      message: '리뷰 목록을 불러오는 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
};

// 리뷰 조회
export const getReview = async (req: CustomRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        comments: true
      }
    });

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    return res.json(review);
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
  }
};

// 리뷰 수정
export const updateReview = async (req: CustomRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { title, bookTitle, content, publisher, bookAuthor } = req.body;

    if (!req.user?.username) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    if (existingReview.user.username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: '리뷰를 수정할 권한이 없습니다.'
      });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        title,
        bookTitle,
        content,
        ...(publisher && { publisher }),
        ...(bookAuthor && { bookAuthor })
      }
    });

    return res.json({
      success: true,
      review: updatedReview
    });
  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '리뷰 수정 중 오류가 발생했습니다.'
    });
  }
};

// 리뷰 삭제
export const deleteReview = async (req: CustomRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const username = req.user?.username;

    // 리뷰 존재 여부 및 작성자 확인
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }
    });

    if (!existingReview) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    if (existingReview.user.username !== username) {
      return res.status(403).json({ message: '리뷰를 삭제할 권한이 없습니다.' });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    return res.json({
      success: true,
      message: '리뷰가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    return res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
  }
};