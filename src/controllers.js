var Controllers = module.exports;

Controllers.renderAdminPage = function(req, res, next) {
	res.render('admin/plugins/dice-bot', {});
}
