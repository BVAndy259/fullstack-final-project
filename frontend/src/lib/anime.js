import { animate, stagger } from 'animejs';

const anime = (params = {}) => {
  const { targets, easing, complete, ...rest } = params;
  const config = {
    ...rest,
    ...(easing ? { ease: easing } : {}),
    ...(complete ? { onComplete: complete } : {}),
  };

  return animate(targets, config);
};

anime.stagger = stagger;

export default anime;
