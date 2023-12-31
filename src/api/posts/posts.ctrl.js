import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from '../../../node_modules/joi/lib/index';

const { ObjectId } = mongoose.Types; // 미들웨어

export const getPostById = async (ctx, next) => {
    // ObjectId 검증
    const { id } = ctx.params;
    if (!ObjectId.isValid(id)) {
        ctx.status = 400; // Bad Request
        return;
    }
    try {
        const post = await Post.findById(id);
        // 포스트가 존재하지 않을 때
        if (!post) {
            ctx.status = 404; // Not Found
            return;
        }
        ctx.state.post = post;
        return next();
    } catch (e) {
        ctx.throw(500, e);
    }
};

export const checkOwnPost = (ctx, next) => {
    const { user, post } = ctx.state;
    if (post.user._id.toString() !== user._id) {
        ctx.status = 403; // 로그인 된 사용자가 포스트 작성자가 아니라면 403 오류를 발생시킴
        return;
    }
    return next();
};

/*
    POST /api/posts
    {
        title: '제목',
        body: '내용',
        tags: ['태그1', '태그2']
    }
*/
export const write = async (ctx) => {
    const schema = Joi.object().keys({
        // 객체가 다음 필드를 갖고 있음을 검증함
        title: Joi.string().required(), // required()가 있으면 필수 항목
        body: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).required(), // 문자열로 이뤄진 배열
    });

    // 검증 후 검증 실패인 경우 에러처리
    const result = schema.validate(ctx.request.body);
    if (result.error) {
        ctx.starus = 400; // Bad Request
        ctx.body = result.error;
        return;
    }

    const { title, body, tags } = ctx.request.body;
    const post = new Post({
        title,
        body,
        tags,
        user: ctx.state.user,
    });
    try {
        await post.save();
        ctx.body = post; // post가 설정되지 않으면 Postman에서 설정되지 않음
    } catch (e) {
        ctx.throw(500, e);
    }
};

/*
    GET /api/posts
*/
export const list = async (ctx) => {
    try {
        const posts = await Post.find().exec();
        ctx.body = posts;
    } catch (e) {
        ctx.throw(500, e);
    }
};

/*
    GET /api/posts
*/
export const read = async (ctx) => {
    ctx.body = ctx.state.post;
};

/*
    DELETE /api/posts/:id
*/
export const remove = async (ctx) => {
    const { id } = ctx.params;
    try {
        await Post.findByIdAndRemove(id).exec();
        ctx.status = 204; // No Content
    } catch (e) {
        ctx.throw(500, e);
    }
};

/*
    PATCH /api/posts/:id
    {
        title: '수정',
        body: '수정 내용',
        tags: ['수정', '태그']
    }
*/
export const update = async (ctx) => {
    const { id } = ctx.params;
    // write에서 사용한 schema와 비슷하나 required()가 없음.
    const schema = Joi.object().keys({
        title: Joi.string(),
        body: Joi.string(),
        tags: Joi.array().items(Joi.string()),
    });

    // 검증 후 검증 실패인 경우 에러처리
    const result = schema.validate(ctx.request.body);
    if (result.error) {
        ctx.status = 400; // Bad Request
        ctx.body = result.error;
        return;
    }

    try {
        const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
            new: true, // 이 값을 설정하면 업데이트된 데이터를 반환함
            // false: 업데이트 되기 전의 데이터를 반환함
        }).exec();
        if (!post) {
            ctx.status = 404;
            return;
        }
        ctx.body = post;
    } catch (e) {
        ctx.throw(500, e);
    }
};
